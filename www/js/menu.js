

function loadRestaurantMenu() {
   var categoryList = getJsonFromSession(MENU_SESSION_KEY).categories;

   for (var i = 0; i < categoryList.length; i++) {
      var category = categoryList[i];
      addCollapsableRow("category_" +category.id, category.name, "accordion");

      var itemList = category.items;
      for (var itemCounter = 0; itemCounter < itemList.length; itemCounter++) {
         var item = itemList[itemCounter];
         // add a collapsable row before we append the item
         //alert("id [" + item.id + "] name [" + item.name + "] category id [" + category.id + "] price [" + item.price + "]")
         addItemToCategory("item_" +item.id, item.name, "category_" + category.id + "_accordion", item.price);

         // now that we have the item added to the category, lets add the condiments and add to cart button
         addCondimentsToMenuItem(item.condiments, item);
         if (item.isCombo === true) {
            addComboItems(item.itemGroups, item);
            // lets build the list of items and headers for the menu
         }
      }
   }
}

function addComboItems(itemGroup, item) {
   //alert("Condiment count [" + condiments.length + "] for [" + item.name + "]");

   // lets loop through the groups of items and display the first panel
   if (itemGroup.length < 1) {
      return;
   }

   var htmlMiddle = "";

   for (var i = 0; i < itemGroup.length; i++) {
      var group = itemGroup[i];
      var divPanelStart = "<div id=\"group_item_" + group.id + "\"  class=\"my-panel\">";
      var divPanelEnd = "</div>"
      var divHeaderStart = "<div class=\"groupItemsCondimentsHeader\">" + group.description + "</div>";
      var divHeaderEnd = "";
      // get a list of the id's for the array
      var itemIdListForArray = "";
      for (var k = 0; k < group.items.length; k++) {
         itemIdListForArray += group.items[k].id + ",";
      }
      itemIdListForArray = itemIdListForArray.substring(0, itemIdListForArray.length - 1); // trim last comma
      // now we are going to get a list of all the items for this groups
      for (var k = 0; k < group.items.length; k++) {
         var currentItem = group.items[k];
         var itemChecked = "", viewable = "";
         if (k == 0) {
            itemChecked = "checked=\"checked\" ";
            viewable = "Viewable";
         }

         var itemLabelStart = "<label class=\"checkbox-btn btn nohover btn-default\" " +
              "onclick=\"displayGroupItemsCondiments(" + item.id + ", " + group.id + ", " + currentItem.id +
              ", [" + itemIdListForArray + "]);\"><input type=\"radio\" name=\"group_" + group.id + "_item\" id=\"group_" +
              group.id + "_item\" value=\"" + currentItem.id + "\" " + itemChecked + ">&nbsp;&nbsp;" + currentItem.name +
              "<div id=\"group_" + group.id + "_item_" + currentItem.id + "_condiments\" class=\"groupItemsCondiments" + viewable + " checkbox-grid\">";

         var itemLabelEnd = "</div></label>";
         itemLabelStart += getCondimentHtml(currentItem.condiments, currentItem, true, "group_" + group.id + "_item_" + currentItem.id + "_");
         //alert(itemLabelStart + itemLabelEnd)
         divHeaderStart += itemLabelStart + itemLabelEnd;
      }
      divPanelStart += divHeaderStart + divHeaderEnd + divPanelEnd;
      //alert(divPanelStart)
      htmlMiddle += divPanelStart;
   }
   //alert(htmlMiddle)
   $("#item_" + item.id + "_condiments").prepend(htmlMiddle).trigger('create');
}

function getCondimentHtml(condiments, item, isButtonSmall, groupName) {
   var upSellList = "", returnHtml = "";
   var checkboxType = "checkbox";
   if (item.oneCondimentOnly == true) {
      checkboxType = "radio";
   }

    if (condiments.length !== 0) {
       var counter = 0;
       for (counter; counter < condiments.length; counter++) {
         var itemCondimentId = condiments[counter];
         var itemChecked = "";
         if (checkboxType == "radio" && counter == 0) {
            itemChecked = "checked=\"checked\"";
         }

         var condiment = getCondimentById(itemCondimentId);
         var name = condiment.name;
         if (condiment.isUpsell) {
            name += " ($" + formatNumber(condiment.price) + ")";
         }

         var buttonSize = "";
         if (isButtonSmall) {
            buttonSize = " btn-xs";
         }
         var html = "<label class=\"checkbox-btn" + buttonSize + " btn btn-default\"><input name=\"condiment_item_" + item.id + "\" id=\"" + groupName + "chkbxCondimentId_" + condiment.id + "\" " +
                "value=\"" + condiment.id + "\" type=\"" + checkboxType + "\" " + itemChecked + " /> " + name + "</label>";

         if (condiment.isUpsell == true) {
            upSellList += html;
         } else {
            returnHtml += html;
         }

         itemChecked = "";
       }

       returnHtml += upSellList;
       // if not an even number, add an extra labeel to work out the kinks in the ui
       if (counter % 2 !== 0) {
          returnHtml += "<label class=\"btn checkbox-btn btn-xs\">&nbsp;</label>";
       }

   } else {
      returnHtml = "";
   }
   return returnHtml;
}

function addCondimentsToMenuItem(condiments, item) {
   //alert("Condiment count [" + condiments.length + "] for [" + item.name + "]");
   var htmlStart = "<form id=\"form_item_" + item.id + "\" action=\"#\" onsubmit=\"return false;\"><input type=\"hidden\" id=\"id_for_item\" value=\"" + item.id  + "\"><div>";
   var htmlEnd = "<br><div style=\"text-align: center\"><p>" +
      "<button type=\"button\" onclick=\"incrementCart('" + item.id + "'); return false;\" class=\"btn btn-primary\"><i class=\"fa fa-plus\"></i></button>&nbsp;&nbsp;&nbsp;" +
      "<span class=\"quantity\" id=\"itemid_" + item.id + "_quantity\">1</span>&nbsp;&nbsp;&nbsp;" +
      "<button type=\"button\" onclick=\"decrementCart('" + item.id + "'); return false;\" class=\"btn btn-danger\"><i class=\"fa fa-minus\"></i></button>" +
      "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<button type=\"button\" class=\"btn btn-success\" id=\"btnAdd\" onclick=\"addToCart('" + item.id + "'); return false;\" >" +
      "<i class=\"fa fa-shopping-cart\"></i>&nbsp;&nbsp;&nbsp;Add to Cart</button></p></div></div></form>";

   var htmlMiddle = "<div class=\"checkbox-grid\">";
   var condimentHtml = getCondimentHtml(condiments, item, false);
   if (condimentHtml === "") {
      htmlMiddle = "";
   } else {
      htmlMiddle += condimentHtml + "</div>";
   }
   //alert(htmlStart + htmlMiddle + htmlEnd)
   $("#item_" + item.id + "_condiments").append(htmlStart + htmlMiddle + htmlEnd).trigger('create');
}

function addToCart(itemId) {
   var err = "";
   var condimentsForCart = [];
   var condimentsCounter = 0;
   var fields = $("#form_item_" + itemId).find(':input');

   var quantity = $("#itemid_" + itemId + "_quantity").text();
   if ( isNaN(quantity) || quantity <= 0 ) {
      return false;
   }

   // get all the checkbox values
   var itemPrice = 0;
   var condimentList = getVarFromSession(CONDIMENT_LIST_SESSION_KEY);
   $.each( fields, function( i, field ) {
      if ( (field.type === "checkbox" || field.type === "radio") && field.checked ) {
         condimentsForCart[condimentsCounter++] = field.value;
         var condiment = getCondimentById(Number(field.value));
         itemPrice += Number(condiment.price);
         if (field.type === "checkbox" ) {
            field.checked = false;
         }
      }
   });

   // don't check combos for duplicates, just regular items
   var itemListItem = getItemById(itemId);
   var itemArray = [];
   var itemArrayCounter = 0;
   if (itemListItem.isCombo === false) {
      // check to see if the item exists, if so, just call the updateCart function
      var itemFound = itemExists(itemId, condimentsForCart);
      if (itemFound > -1) {
         updateCart(itemFound, quantity);
         $("#modal-message").text("Item exists in the cart already. The quantity has been updated.");
         $("#myModal").modal('show');
         setTimeout(function(){ $("#myModal").modal('hide'); }, 2500);
         $("#itemid_" + itemId + "_quantity").text("0");
         return false;
      }
   } else {
      // it's a combo, lets get the items/condiments from the groups
      var itemGroup = itemListItem.itemGroups;

      for (var i = 0; i < itemGroup.length; i++) {

         var group = itemGroup[i];
         var radioId =  "group_" + group.id + "_item";
         var radioVal = $("input[name=" + radioId + "]:checked").val();
         var currentItem = getItemById(radioVal);

         var condimentArray = [];
         var condimentArrayCounter = 0;
         for (var x = 0; x < currentItem.condiments.length; x++) {
            var c = currentItem.condiments[x];
            var idName = "group_" + group.id + "_item_" + currentItem.id + "_chkbxCondimentId_" + c
            var chkbox = $("#" + idName);
            if(chkbox.prop('checked') === true) {
               condimentArray[condimentArrayCounter++] = c;
               var condimentPrice = getCondimentById(c);
               itemPrice += Number(condimentPrice.price);
            }
         }
         var newItem = {id: currentItem.id, condiments: condimentArray};
         itemArray[itemArrayCounter++] = newItem;
      }
   }

   // lets check the combo
   var combo = false;
   if (itemArray.length > 0) {
      combo = true;
   }

   var itemTotalPrice = itemPrice + getItemById(itemId).price;
   var totalPrice = itemTotalPrice * quantity;
   var cartCounter = getNextCartItemCount();
   var item = { id: itemId, quantity: quantity, condiments: condimentsForCart, cartIdentifierId: cartCounter,
      price: itemTotalPrice, isCombo: combo, itemGroups: itemArray};

   var cart = getJsonFromSession(CART_SESSION_KEY);
   if (cart === null) {
      cart = {total: 0, items: []};
   }
   cart.items[cartCounter] =  item;
   cart.total = cart.total + totalPrice;
   addJsonToSession(CART_SESSION_KEY, cart);
   loadCartText();
   $("#itemid_" + itemId + "_quantity").text("1");

   $("#modal-message").text("The item has been added to the cart.");
   $("#myModal").modal('show');
   setTimeout(function(){
      $("#myModal").modal('hide');
      window.location.href = "menu.html";
   }, 2000);
}

function updateCart(cartIdentifierId, quantity) {
   var cart = getJsonFromSession(CART_SESSION_KEY);
	var itemList = getItemList();
   for (var i =0; i < cart.items.length; i++) {
		if (cart.items[i] === null) {
			continue;
		}
		if (cart.items[i].cartIdentifierId === cartIdentifierId) {
         var newItemTotal = quantity * cart.items[i].price;
			cart.items[i].quantity = +cart.items[i].quantity + +quantity;
         cart.total = cart.total + (quantity * cart.items[i].price);

			// TODO - update cart total based on quantity
			addJsonToSession(CART_SESSION_KEY, cart);
         loadCartText();
         return;
		}
	}
}

function itemExists(itemId, itemCondiments) {
   var cart = getJsonFromSession(CART_SESSION_KEY);
   if (cart === null) {
      return -1;
   }
   var itemList = getItemList();
   var matchCount = 0;
   for (var i =0; i < cart.items.length; i++) {
      if (cart.items[i] === null) {
         continue;
      }

      if (cart.items[i].id === itemId) {
         if ( cart.items[i].condiments.length !== itemCondiments.length ) {
              continue;
         } else {
      		for (var counter = 0; counter < cart.items[i].condiments.length; counter++) {
               for(var x = 0; x < itemCondiments.length; x++) {
                  if (itemCondiments[x] === cart.items[i].condiments[counter]) {
                     matchCount++;
                  }
               }
      		}
            if (itemCondiments.length === matchCount) {
               return cart.items[i].cartIdentifierId;
            } else {
               matchCount = 0;
               continue;
            }
         }
      }
   }
   return -1;
}

function getValueFromFormFields(fields, startsWithString, isReplaceValue, replaceValue) {
   var fieldValue = 0;
    $.each( fields, function( i, field ) {
       if ( field.id.indexOf(startsWithString) > -1 ) {
           fieldValue = field.value;
           if (isReplaceValue) {
             field.value = replaceValue;
          }
           return;
       }
   });
   return fieldValue;
}

function addItemToCategory(id, name, appendTo, price) {
   var div = "<div class=\"panel panel-default\">" +
       "<div data-toggle=\"collapse\" data-parent=\"#" + appendTo + "\" data-target=\"#item_panel_" + id +
       "\" class=\"panel-heading\" style=\"background-color: #" + itemHeaderBgColor + "; color: #" + itemHeaderFontColor + "\">" +
       "     <h4 class=\"panel-title\">" + name + " - $" + formatNumber(price) + "</h4>" +
       "</div>" +
       "<div id=\"item_panel_" + id + "\" class=\"panel-collapse collapse\" style=\"background-color: #" + itemPanelBgColor + "\">" +
      "     <div class=\"panel-body\"><div  id=\"" + id + "_condiments\"></div>" +
      " </div></div>";
      // alert(div);
   $("#" + appendTo).append(div).trigger('create');
}

function addCollapsableRow(id, name, appendTo) {
   var div = "<div class=\"panel panel-default\">" +
       "<div data-toggle=\"collapse\" data-parent=\"#" + appendTo + "\" data-target=\"#category_panel_" + id +
       "\" class=\"panel-heading\" style=\"background-color: #" + categoryHeaderBgColor + "; color: #" + categoryHeaderFontColor + "\">" +
       "     <h4 class=\"panel-title\">" + name + "</h4>" +
       "</div>" +
       "<div id=\"category_panel_" + id + "\" class=\"panel-collapse collapse\" style=\"background-color: #" + categoryPanelBgColor + "\">" +
      "     <div class=\"panel-body\" ><div class=\"panel-group\" id=\"" + id + "_accordion\"></div>" +
      " </div></div>";
      // alert(div);
   $("#" + appendTo).append(div).trigger('create');
}
