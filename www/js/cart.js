function loadCartView() {
	// retrieve the items from the context

   var cart = getJsonFromSession(CART_SESSION_KEY);
   if (cart === null) {
      return; // there are no items in the cart
   }
	var itemList = getItemList();
   for (var i =0; i < cart.items.length; i++) {
		if (cart.items[i] === null) {
			//alert("cart item null for item [" + i + "]")
			continue;
		}
		var item =  JSON.parse(itemList[cart.items[i].id]);
		var quantity = cart.items[i].quantity;
      var total = quantity * cart.items[i].price;

      var substringLength = 3;
      if (cart.items[i].isCombo) {
         substringLength = 5;
      }
      var condimentsString = buildCondimentList(cart.items[i]).substring(substringLength);

      var cartIdentifierId = cart.items[i].cartIdentifierId;

      var div = "<div class=\"view-cart-item-table\" id=\"cartTableRow_" + cartIdentifierId + "\"><div class=\"view-cart-item-table-row\"><div class=\"view-cart-item-table-cell-top-left\">" +
            "<p class=\"view-cart-item-header\">" + item.name + "</p><p>" + condimentsString + "</p></div>" +
            "<div class=\"view-cart-item-table-cell-top-right view-cart-strong\">$<span id=\"itemid_" + cartIdentifierId +"_price\">" + formatNumber(total) + "</span></div></div>" +
            "<div class=\"view-cart-item-table-row\"><div class=\"view-cart-item-table-cell-bottom-left\">" +
            "<button type=\"button\" onclick=\"cartIncrement('" + cartIdentifierId + "'); return false;\" name=\"btnUpdateCart\" class=\"btn btn-primary\">&nbsp;<i class=\"fa fa-plus\"></i>&nbsp;</button>&nbsp;&nbsp;" +
            "<button type=\"button\" onclick=\"cartDecrement('" + cartIdentifierId + "'); return false;\" name=\"btnUpdateCart\" class=\"btn btn-danger\">&nbsp;<i class=\"fa fa-minus\"></i>&nbsp;</button>&nbsp;&nbsp;&nbsp;" +
            "Quantity&nbsp;&nbsp;<span class=\"view-cart-strong\" id=\"itemid_" + cartIdentifierId +"_quantity\">" + quantity + "<span></div>" +
            "<div class=\"view-cart-item-table-cell-bottom-right\"><button type=\"button\" onclick=\"showDeleteModal('" + cartIdentifierId + "'); return false;\" name=\btnRemoveCart\" " +
            "class=\"btn btn-danger\">&nbsp;<i class=\"fa fa-trash\"></i>&nbsp;</button></div></div></div><br>";
  		$("#cartForm").append(div).trigger("create");
	}
   calculateCartTotals();
}

function cartIncrement(cartIdentifierId) {
   incrementCart(cartIdentifierId);
   var quantity = $("#itemid_" + cartIdentifierId + "_quantity").text();
   updateCartItemQuantity(cartIdentifierId, quantity);
}

function cartDecrement(cartIdentifierId) {
   var quantity = $("#itemid_" + cartIdentifierId + "_quantity").text();
   if (quantity > 1) {
      decrementCart(cartIdentifierId);
      quantity = $("#itemid_" + cartIdentifierId + "_quantity").text();
      updateCartItemQuantity(cartIdentifierId, quantity);
   }
}

function updateCartItemQuantity(cartIdentifierId, quantity) {
	var cart = getJsonFromSession(CART_SESSION_KEY);
	var itemList = getItemList();
   for (var i =0; i < cart.items.length; i++) {
		if (cart.items[i] === null) {
			continue;
		}
		if (cart.items[i].cartIdentifierId == cartIdentifierId) {
			cart.items[i].quantity = quantity;
         var itemTotal = quantity * cart.items[i].price;
         $("#itemid_" + cartIdentifierId +"_price").text(formatNumber(itemTotal));
      }
	}
   addJsonToSession(CART_SESSION_KEY, cart);
   loadCartText();
   calculateCartTotals();
}

function calculateCartTotals() {
   var tax = 0.08;
   var subTotal = 0;
   var cart = getJsonFromSession(CART_SESSION_KEY);

   for (var i =0; i < cart.items.length; i++) {
		if (cart.items[i] === null) {
			continue;
		}
		subTotal += cart.items[i].price * cart.items[i].quantity;
	}

   var promoDiscount = getVarFromSession(PROMO_DISCOUNT_SESSION_KEY);
   var promoDiscountType = getVarFromSession(PROMO_DISCOUNT_TYPE_SESSION_KEY);
   var promoDiscountName = getVarFromSession(PROMO_DISCOUNT_NAME_SESSION_KEY);

   if (promoDiscountType !== null && promoDiscountType !== "") {
      if (Number(promoDiscountType) === 2) {
         // multiple the percentage of the discount
         promoDiscount = Number(promoDiscount) * subTotal;
      }
      subTotal = subTotal - Number(promoDiscount);
   } else {
      promoDiscount = 0;
   }

   tax = tax * subTotal;
   var total = tax + subTotal;

   //alert("tax [" + formatNumber(tax) + "] promoDiscount [" + formatNumber(promoDiscount) + "] subTotal [" +
   //     formatNumber(subTotal) + "] total [" + formatNumber(total) + "]");

   // update fields
   if (promoDiscountName !== null && promoDiscountName !== "") {
      $("#cart-promo-discount-text").text("Discount (" + promoDiscountName + ") ");
   } else {
      $("#cart-promo-discount-text").text("Discount");
   }

   $("#cart-subTotal").text(formatNumber(subTotal));
   $("#cart-discount").text(formatNumber(Number(promoDiscount)));
   $("#cart-tax").text(formatNumber(tax));
   $("#cart-total").text(formatNumber(total));
}

function showDeleteModal(itemId) {
   $("#modalItemId").val(itemId);
   $("#myModal").modal('show');
}

function removeItemFromCart() {
   $("#myModal").modal('hide');
   var cartIdentifierId = $("#modalItemId").val();
	var cart = getJsonFromSession(CART_SESSION_KEY);
	var itemList = getItemList();
   for (var i = 0; i < cart.items.length; i++) {
		if (cart.items[i] === null) {
			continue;
		}
		if (cart.items[i].cartIdentifierId == cartIdentifierId) {
         if (getJsonFromSession(PROMO_CODE_SESSION_KEY) !== undefined && getJsonFromSession(PROMO_CODE_SESSION_KEY) !== null) {
            var promo = getJsonFromSession(PROMO_CODE_SESSION_KEY);
            if (promoItemExists(Number(promo.itemId))) {
               removePromoCode();
            }
         }

			delete cart.items[i];
         cart.items = $.grep(cart.items,function(n){ return(n) });
			addJsonToSession(CART_SESSION_KEY, cart);
         $("#cartTableRow_" + cartIdentifierId).next().remove();
         $("#cartTableRow_" + cartIdentifierId).remove();
         calculateCartTotals();
         loadCartText();
		}
	}

   // remove any left over promo codes if there aren't any items in the cart
   var itemCount = 0;
   for (var i = 0; i < cart.items.length; i++) {
		if (cart.items[i] === null) {
			continue;
		}
      itemCount++;
   }
   if (itemCount === 0) {
      removePromoCode();
   }
}

function addPromoCode() {
	var promoCode = $("#txtPromo").val();

   if (promoCode === "") {
      return;
   }
   $.ajax({
      //url: "http://mobile-kstane.rhcloud.com/rest/menu/1",
      url: PROMO_URL + promoCode,  // defined in constants.js
      cache: false,
      success: function(data) {
         var response = JSON.parse(data).response;
         if (response.error !== undefined ) {
            showModal("errorModal", "errorMessage", response.error);
            return;
         }

         var promo = response.promoCode;
         if (promo.isActive === false) {
            showModal("errorModal", "errorMessage", "The entered promotional/coupon code [" + promoCode + "] is not acitve.");
            return;
         }
         addJsonToSession(PROMO_CODE_SESSION_KEY, promo);
         applyPromoCode();
      },
      error: function(error) {
         //console.log("error updating table -" + error.status);
         alert(JSON.stringify(error, null, 2))
      },
      complete: function() {
      }
   });
}

function applyPromoCode() {
   /**
    LETS CHECK THE DISCOUNT ID'S
      1 - Specific Dollar Amount off the sub-total - associated with a franchise/restaurant/user id/item
      2 - Percent off the - associated with a franchise/restaurant/user id
      3 - Free item - associated with an item id
    **/
    var promo = getJsonFromSession(PROMO_CODE_SESSION_KEY);

    // check for a free item first
    if (Number(promo.discountTypeId) === 3) {
      // check to see if the product exists
      if (promoItemExists(Number(promo.itemId)) === false) {
          showModal("errorModal", "errorMessage", "The entered promotional/coupon code [" + promo.name +
                    "] does not have an item in the cart to apply the promotion to.");
          return;
      }

      // get the item price from the list of items, and apply it to the cart totals
      var item = getItemById(promo.itemId);
      addVarToSession(PROMO_DISCOUNT_SESSION_KEY, item.price + "");
      addVarToSession(PROMO_DISCOUNT_TYPE_SESSION_KEY, 1);
      addVarToSession(PROMO_DISCOUNT_NAME_SESSION_KEY, promo.name);
      calculateCartTotals();
      $("#promoModal").modal('show');
      return;
    }

    if (promo.userId !== null && promo.userId != "") {
      // if associated with a user id, confirm it's for the right user
      var sessionUserId = getUserIdFromSession();
      if (Number(sessionUserId) !== Number(promo.userId)) {
         showModal("errorModal", "errorMessage", "The entered promotional/coupon code [" + promo.name +
                   "] does not apply to your login information.");
         return;
      }
    }

    // check to make sure the discount is applied to the proper restaurant
    if (promo.restaurantId !== null && promo.restaurantId != "") {
      // if associated with a user id, confirm it's for the right user
      var sessionRestaurantId = getRestaurantIdFromSession();
      if (Number(sessionRestaurantId) !== Number(promo.restaurantId)) {
         showModal("errorModal", "errorMessage", "The entered promotional/coupon code [" + promo.name +
                   "] does not apply to this restaurant.");
         return;
      }
    }

    // check to make sure they have the right franchise if applicable
    if (promo.franchiseId !== null && promo.franchiseId != "") {
      // if associated with a user id, confirm it's for the right user
      var sessionFranchiseId = getFranchiseIdFromSession();
      if (Number(sessionFranchiseId) !== Number(promo.franchiseId)) {
         showModal("errorModal", "errorMessage", "The entered promotional/coupon code [" + promo.name +
                   "] does not apply to this restaurant.");
         return;
      }
    }

    // all checks are passed, lets add the discount to the price
    // 1 - Dollar Amount
    // 2 - Percentage off
    addVarToSession(PROMO_DISCOUNT_TYPE_SESSION_KEY, promo.discountTypeId + "");
    addVarToSession(PROMO_DISCOUNT_SESSION_KEY, promo.discount + "");
    addVarToSession(PROMO_DISCOUNT_NAME_SESSION_KEY, promo.name);
    $("#promoModal").modal('show');
    calculateCartTotals();
}

function promoItemExists(itemId) {
   var cart = getJsonFromSession(CART_SESSION_KEY);
   if (cart === null) {
      return -1;
   }
   var itemList = getItemList();
   for (var i =0; i < cart.items.length; i++) {
      if (cart.items[i] === null) {
         continue;
      }

      if (Number(cart.items[i].id) === itemId) {
         return true;
      }
   }
   return false;
}

$(function() {
  var txt = $("#txtPromo");
  var func = function() {
    txt.val(txt.val().replace(/[^0-9A-Za-z-]/g, ""));
  }
  txt.keyup(func).blur(func);
});

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

function showModal(modalId, modalMessageId, message) {
   $("#" + modalMessageId).text(message);
   $("#" + modalId).modal('show');
}
