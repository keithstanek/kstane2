jQuery(function($) {'use strict';

	// portfolio filter
	$(document).ready(function(){
		// first check to make sure they are logged in, either as a person or guest
		var userLoggedIn = loggedIn();
		 if (!userLoggedIn) {
			$("#modal").modal({
           backdrop: 'static',
           keyboard: false
         })
			return
		 }

		 // remove testing only
		 loadActiveOrders();
		 createChannels();
	});

	function loggedIn() {
		var userInfo = JSON.parse(window.sessionStorage.getItem("USER_INFO"));
		if (userInfo === null) {
			return false;
		}
		return true;
	}
});

function login() {
   var email = $("#txtLoginEmail").val();
   var password = $("#txtLoginPassword").val();

   if (email === "") {
      $("#errors").text("Email Address can not be empty. Please fill out the Email Address text");
      return;
   }

   if (password === "") {
      $("#errors").text("Password can not be empty. Please fill out the Password text");
      return;
   }

  var request = {
    "username": email,
    "password": password
   }

   var LOGIN_URL = HOST + "/user/index.php/restaurant-login"

   $.ajax({
      type: 'POST',
      contentType: 'application/json',
      url: LOGIN_URL,
      dataType: "json",
      data: JSON.stringify(request),
      success: function(data, textStatus, jqXHR){
         //var r = JSON.parse(jqXHR);
         //alert(data);
         //return;
         var x = JSON.parse(data);
         //("response error: " + x.response.error);
         if (x.response.error === "INVALID LOGIN") {
            $("#errors").text("Invalid Login. Please try again.");
            return;
         }
         var u = x.response.user;
         if (u.restaurantId === "") {
            $("#errors").text("The account is not tied to a restaurant. Please try again.");
            return;
         }
         window.sessionStorage.setItem("USER_INFO", JSON.stringify(u));
         window.sessionStorage.setItem(RESTAURANT_ID_SESSION_KEY, u.restaurantId);
         $("#modal").modal('hide');
         // load the current orders if any
			loadActiveOrders();
         // rergister the listeners for new orders
         createChannels();
      },
      error: function(jqXHR, textStatus, errorThrown){
         //alert('addWine error: ' + textStatus +' ' + errorThrown + ' ' + JSON.stringify(jqXHR));
         alert('error: ' + textStatus);
         alert('error: ' + errorThrown);
         alert('error:\n' + JSON.stringify(jqXHR));
      },
      complete: function() {
         //alert("complete")
      }
  });
}


function loadActiveOrders() {
	var url = HOST + "/order/index.php/active-orders/" + window.sessionStorage.getItem(RESTAURANT_ID_SESSION_KEY);
	$.ajax({
      type: 'GET',
      contentType: 'application/json',
      url: url,
      dataType: "json",
      success: function(data, textStatus, jqXHR){
         var orders = data.orders;

			window.sessionStorage.setItem(ITEM_LIST_SESSION_KEY, JSON.stringify(data.items));
			window.sessionStorage.setItem(CONDIMENT_LIST_SESSION_KEY, JSON.stringify(data.condiments));

			for (var k = 0; k < data.orderStatusList.length; k++) {
				var status = data.orderStatusList[k];
				STATUS_LIST[status.status] = status;
			}

         for (var i = 0; i < orders.length; i++) {
				var order = orders[i];
				ORDER_LIST[order.id] = order;
				addRow(order);
			}
      },
      error: function(jqXHR, textStatus, errorThrown){
         //alert('addWine error: ' + textStatus +' ' + errorThrown + ' ' + JSON.stringify(jqXHR));
         alert('error: ' + textStatus);
         alert('error: ' + errorThrown);
         alert('error:\n' + JSON.stringify(jqXHR));
      },
      complete: function() {
         //alert("complete")
      }
  });
}

// lets create our item array to load id/object pairs for each order
var ORDER_LIST = {};
var STATUS_LIST = {};
//var HOST = "http://127.0.0.1/~kstane/mobile/rest-api";
var HOST = "../rest-api/rest-api";
var RESTAURANT_ID_SESSION_KEY = "RESTAURANT_ID";
var ITEM_LIST_SESSION_KEY = "ITEM_LIST";
var CONDIMENT_LIST_SESSION_KEY = "CONDIMENT_LIST";

function stopAlert() {
   audio.pause();
}

function startAlert() {
   audio.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
   }, false);
   audio.play();
}

function dataReceived(d) {
   $('#panelCellRight').append(d);
   showPopup();
   startAlert();
}

function showPopup() {
   RichFaces.component('popup').show();
}

function updateStatus(orderId) {
   var e = $("#btnOrderStatus_" + orderId);
   clearTimeout($("#timerId_" + orderId).val());
	var statusKey = findStatusByDisplayText(e.text());

   // send ajax request to change the order status and push notification to client
	var url = HOST + "/order/index.php/status/" + orderId + "/" + statusKey;
   $.get(url,
      function (data) {
			var nextStatus = getNextOrderStatus(statusKey)
			if (nextStatus == "NONE") {
				$("#btnOrder_" + orderId).remove();
				resetForm();
				delete ORDER_LIST[orderId];
			}
			e.text(nextStatus);
			e.removeClass("btn-danger").addClass("btn-success");
			$("#btnOrder_" + orderId).removeClass("btn-danger").addClass("btn-success");
      }
   );
}

function resetForm() {
	$("#orderDetailHeader-number").text("");
	$("#customer-name").text("");
	$("#customer-phone").text("");
	$("#customer-email").text("");
	$("#order-date").text("");
	$("#order-summary").html("");

	$("#sub-total").text("0.00");
	$("#tax-total").text("0.00");
	$("#discount").text("0.00 []");
	$("#total").text("0.00");
	$("#order-detail-update-status-btn").html("");
}

function createChannels() {
   var pusher = new Pusher('59d05b5b4f445c7c4573', {
     encrypted: true
   });

   var restaurantId = window.sessionStorage.getItem(RESTAURANT_ID_SESSION_KEY);
   var RESTAURANT_CHANNEL = "RESTAURANT_" + restaurantId + "_CHANNEL";
   var channel = pusher.subscribe(RESTAURANT_CHANNEL);

   channel.bind('NEW_ORDER', function(data) {
	  var order = JSON.parse(data);

	  var button = "<span style=\"margin: 3px;\" onclick=\"viewDetail('" + order.id + "')\" id=\"btnOrder_" + order.id + "\" " +
	 	 "class=\"btn btn-lg btn-danger\"><input type=\"hidden\" value=\"0\" id=\"timerId_" + order.id +
	 	 "\">Order Item<br>No. " + order.id + "</span>";

	  // add the data to the table
	  $("#order-buttons").prepend(button);

	  // add the timer for the button to turn red
     var btnName = "btnOrder_" + order.id;
     timerId = setTimeout(function() {
        $("#" + btnName).removeClass("btn-success").addClass("btn-danger");
     }, 5000);
     $("#timerId_" + order.id).val(timerId);

	  // add the order to the order list for look up later for order detail
	  ORDER_LIST[order.id] = order;
   });
}

function loadOrderSummary(order) {
	var itemList = JSON.parse(window.sessionStorage.getItem(ITEM_LIST_SESSION_KEY));
	for (var i =0; i < order.items.length; i++) {
		if (order.items[i] == null) {
			continue;
		}
		var orderItem = order.items[i];
		var itemName = getItemNameById(orderItem.itemId);

		var div = "<div><div class=\"item-cell\">[" + orderItem.quantity + "]&nbsp;&nbsp;</div>" +
				"<div class=\"item-cell\">" + itemName + buildCondimentList(orderItem) + "</div></div>";
		$("#order-summary").append(div).trigger("create");
	}
}

function getItemNameById(id) {
	var itemList = JSON.parse(window.sessionStorage.getItem(ITEM_LIST_SESSION_KEY));
	for (var i = 0; i < itemList.length; i++) {
		var item = itemList[i];
		if (item.id == id) {
			return item.name;
		}
	}
}

function checkNull(text) {
	if (text == null) {
		return ""
	}
	return text;
}

function viewDetail(id) {
	resetForm();
	var order = ORDER_LIST[id];
	$("#orderDetailHeader-number").text(order.id);
	$("#customer-name").text(order.name);
	$("#customer-phone").text(order.phone);
	$("#customer-email").text(order.email);

	$("#order-date").text(order.dateCreated);

	$("#sub-total").text(formatNumber(Number(order.subTotal)));
	$("#tax-total").text(formatNumber(Number(order.taxTotal)));
	$("#discount").text(formatNumber(Number(order.discountTotal)) + " [" + checkNull(order.promoCode) + "]");
	$("#total").text(formatNumber(Number(order.total)));

	loadOrderSummary(order);

	var btnStyle = "btn-success";
	if (order.orderStatus == "ORDER_SENT_TO_STORE") {
		btnStyle = "btn-danger";
	}
	var orderStatus = getNextOrderStatus(order.orderStatus);
	var btnText = "<span class=\"btn btn-lg " + btnStyle + "\" style=\"diplay: block\" id=\"btnOrderStatus_" + order.id + "\" " +
			"onclick=\"updateStatus('" + order.id + "');\">" + orderStatus + "</span>";
	$("#order-detail-update-status-btn").html(btnText);
}

function findStatusByDisplayText(text) {
	for (var key in STATUS_LIST) {
	   if (STATUS_LIST.hasOwnProperty(key)) {
	      if (STATUS_LIST[key].displayText == text) {
				return key;
			}
	   }
	}
}

function getNextOrderStatus(currentStatus) {
	var status = STATUS_LIST[currentStatus];
	if (status.nextStatus == "NONE") {
		return "NONE";
	}
	var nextStatus = STATUS_LIST[status.nextStatus];
	return nextStatus.displayText;
}

function getNextDbOrderStatus(currentStatus) {
	var status = STATUS_LIST[currentStatus];
	return status.nextStatus;
}

function addRow(order) {
	var currentTime = new Date();

	var btnStyle = "btn-success";
	var dateCreated = Date.parse(order.dateCreated.replace(/ /g,"T"));
	// if ( (Date.parse(currentTime) - dateCreated) > 120000 && order.orderStatus == "ORDER_SENT_TO_STORE") {
	// alert("status [" + order.orderStatus + "]")
	if (order.orderStatus == "ORDER_SENT_TO_STORE") {
		btnStyle = "btn-danger";
	}

	var orderStatus = getNextOrderStatus(order.orderStatus);
	var button = "<span style=\"margin: 3px;\" onclick=\"viewDetail('" + order.id + "')\" id=\"btnOrder_" + order.id + "\" " +
	    "class=\"btn btn-lg " + btnStyle + "\"><input type=\"hidden\" value=\"0\" id=\"timerId_" + order.id +
		 "\">Order Item<br>No. " + order.id + "</span>";

	// add the data
	$("#order-buttons").prepend(button);
}

function buildCondimentList(item) {
	var condimentDictionary = getCondimentDictionary();
	var returnString = " - ";
	if (item.isCombo === true || item.isCombo == 1) {
		var groups = item.itemGroups;
		returnString = ":<br>";
		for (var i = 0; i < item.itemGroups.length; i++) {
			var group = item.itemGroups[i];
			var itemId = group.itemId;
			var currentItemName = getItemNameById(itemId);
			returnString += currentItemName;
			if (group.condiments.length > 0) {
				returnString += " - ";
				for (var counter = 0; counter < group.condiments.length; counter++) {
				  returnString += condimentDictionary[group.condiments[counter]].name + ", ";
			   }
				returnString = returnString.substring(0, returnString.length - 2); // trim the extra ,
			}
			returnString += "<br>";
		}
		return returnString.substring(0, returnString.length - 4); // trim the extra <br>
	} else{
		if  (item.condiments.length !== 0) {
			for (var counter = 0; counter < item.condiments.length; counter++) {
			  returnString = returnString + condimentDictionary[item.condiments[counter]].name + ", ";
		   }
		}
		return returnString.substring(0, returnString.length - 2); // trim the extra ,
  }

  return "";
}

function formatNumber(number) {
	return number.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
}

function getCondimentDictionary() {
	var list = JSON.parse(window.sessionStorage.getItem(CONDIMENT_LIST_SESSION_KEY));
	var dictionary = [];
	for (var i = 0; i < list.length; i++) {
		condiment = list[i];
		dictionary[condiment.id] = condiment;
	}
	return dictionary;
}
