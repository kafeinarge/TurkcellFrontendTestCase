/*
** @author: halil bilir
*/

var SHOP = SHOP || {},
    SH = SHOP;

(function (SHOP, $) {
    "use strict";

    // set initial values
    SHOP.msisdn = "";
    SHOP.isDevModeActive = false;
    SHOP.isNoneLoginSale = false;
    SHOP.formPath = "sepetim";
    SHOP.siteAssetsDomain = "";
    SHOP.pricingScrollTopMargin = 150;
    var config$ = $("#sh_config");

    SHOP.msisdn = $.trim( $("#current_msisdn").data("msisdn") ) || window.visitormsisdn;
    SHOP.isDevModeActive = config$.data("devMode");
    SHOP.siteAssetsDomain = config$.data("siteAssets");

    SHOP.pushTealiumState = function( _conf, _pushPathname ) {
    	
    	
    	try{
    		
        var utagStatus = window.utagStatus,

            _log = function( _txt ) {
                if ( false ) { // donotlog
                    if ( window.console && _txt ) {
                        console.log( _txt );
                    }
                }
            };

        // check utag.js script's load status
        if ( utagStatus !== "ready" ) {
            if ( utagStatus === "error" ) { // exit if error
                _log("utag script could not be loaded");
            } else { // setTimeout if in progress
                _log("utag not ready, try again after 1000 ms");
                setTimeout(function() {
                    SHOP.pushTealiumState( _conf, _pushPathname );
                }, 1000);
            }
            return;
        }

        var conf = utag_data || {},
            log,
            utag = window.utag;

        // if the conf parameter type is string, push pageName
        if ( typeof _conf === "string" ) {
            // the default value of pushPathname parameter is true
            // if it is passed as false, conf string will be pushed without the page location
            conf.pageName = ( _pushPathname === false ) ? _conf : window.location.pathname + "/" + _conf;;
        } else { // otherwise, expect the parameter to be an object, and push it without any modification
            conf = $.extend(conf, _conf);
        }

        if ( JSON ) {
            log = JSON.stringify( conf );
        }
        
        conf.event = 'GAVirtual';
        dataLayer.push(conf);
        
        _log( log );

        //rbm shine section
        if (typeof RbmServerUtil != "undefined"){
            //notify to shine
            RbmServerUtil.pushToShine(conf);
        }
        //if customer clicked the offer
        if (null != conf && null != conf["recommendationClick"] && conf["recommendationClick"] == true) {
        	var offerURL = conf["offerURL"],
        		offerSource = conf["source"];
        	
        	var splittedOfferURL = offerURL.split("?");
        	
        	var placeParam = false;
        	
        	var offerForm = $("<form/>");
        	offerForm.attr("action",splittedOfferURL[0]);
        	
        	// check offerURL place param and other params
        	if(typeof splittedOfferURL[1] != "undefined"){
        		var params = splittedOfferURL[1].split("&");
        		for(var i=0; i<params.length; i++){
        			var splittedParam = params[i].split("=");
        			if(splittedParam[0] == "place"){
        				placeParam = true;
        			}
        			offerForm.append($("<input/>").attr("name", splittedParam[0]).attr("value", splittedParam[1]));
        		}
        	}
        	if(placeParam == false){
        		offerForm.append($("<input/>").attr("name", "place").attr("value", offerSource));
        	}
        	$(document.body).append(offerForm);
            setTimeout(function () {
                offerForm.submit();
            }, 1000);
        }
    	} catch(err) {
    		console.log(err);
    	}
    };
    
    //Passes the referral parameter of url via query parameter named place
    SHOP.addUrlParameter = function( _divName , _referralIndicator , flag) {
   		if( flag ) {
   		   $( _divName ).find( 'a' ).each( function() {
   			   var separator = this.href.indexOf( "?" ) !=-1 ? "&" : "?";
   			   if(this.href.indexOf("#") != -1 ){
   				   var divPart = this.href.substring(this.href.indexOf("#"), this.href.length);
   				   this.href = this.href.substring(0, this.href.indexOf("#")) + separator + "place=" + _referralIndicator + divPart;
   			   } else {
   				   this.href = this.href + separator + "place=" + _referralIndicator;   
   			   }
   			   
   		   });
   		   
   		 }
    };
    SHOP.getQueryVariable = function( variable ) {
        var query = window.location.search.substring(1),
            vars = query.split('&');

        for (var i = 0, len = vars.length; i < len; i++) {
            var pair = vars[i].split('=');

            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent( pair[1] );
            }
        }

        return "";
    };

    SHOP.isUserLoggedIn = function() {
        return SHOP.msisdn && SHOP.msisdn.length > 0;
    };
    
    SHOP.getFormattedPrice = function(price) {
        var formattedPrice =  price.toString().replace(".", ","),
            afterComma = formattedPrice.substr(formattedPrice.indexOf(",")+1);
        if( afterComma === "00" || afterComma === "0" ) {
            return formattedPrice.substr(0, formattedPrice.indexOf(","));
        }
        return formattedPrice;
    };

    /*
    ** getServiceResponse method needs to be called with an url parameter
    ** _data, _callback and _type parameters are optional
    ** and those must be encapsulated by a parent object
    ** i.e. SHOP.getServiceResponse( "test.do", 
    **      {"postdata": yourDataObject, "callback" : successCallbackFunction, "type" : "GET" } );
    ** 
    ** this method returns JSON object if the response content type is application/json
    ** otherwise, it returns plain text
    */
    SHOP.getServiceResponse = function(_url, _opts) {
        if ( typeof _url === "string" ) {
            var opts = _opts || {},

                ajaxSettings = {
                    type : opts.type || "POST",
                    url : _url,
                    headers : opts.headers || { "X-Tcell-Ajax": "true" },
                    cache: ( opts.cache === false ) ? false : true,
                    data : opts.postdata || {}
                };

            if ( opts.dataType ) {
                ajaxSettings.dataType = opts.dataType;
            }

            if ( opts.jsonpCallback ) {
                ajaxSettings.jsonpCallback = opts.jsonpCallback;
            }

            $.ajax( ajaxSettings ).done(function(response) {
                if ( $.isFunction ( opts.callback ) ) {
                    opts.callback( response );
                }
            }).fail(function(jqXhr, textStaus, errorThrown) {
                // no error message on user abort
                if (jqXhr.status === 0 || jqXhr.readyState === 0) {
                    return;
                }

                if ( $.isFunction ( opts.fail ) ) { // call fail function of caller, if exists
                    opts.fail( jqXhr, textStaus, errorThrown );
                } else { // perform the default fail action
                    if ( opts.popErrorMessages !== false ) {
                        SHOP.showErrorModal();
                    }

                    throw "ajax call to " + _url + " has failed! Error message: " + errorThrown;
                }
            });

        } else {
            throw "getJSON() : this method needs url argument";
        }

    };

    /*
    ** getJSONObject method promises to return JSON object regardless of response content type
    */
    SHOP.getJSONObject = function (_url, _opts) {
        var opts = _opts || {},
            originalCallback = opts.callback;

        if ( $.isFunction( originalCallback ) ) {
            var handleResponse = function (response) {
                if ( typeof response === "string" ) {
                    response = $.parseJSON( response );
                }

                originalCallback( response );
            };

            opts.callback = handleResponse;
            this.getServiceResponse(_url, opts);
        } else {
            throw "getJSONObject() : this method needs _callback parameter";
        }

    };

    /*
    ** getJSONPObject uses getJSONObject method, and helps making 'same origin policy' happy
    */
    SHOP.getJSONPObject = function (_url, _opts) {
        var opts = _opts || {};

        opts.dataType = "jsonp";
        opts.jsonpCallback = "callback";

        SHOP.getServiceResponse( _url, opts );
    };

    SHOP.getOmccToken = function(_url, _opts, _data) {
        var opts = _opts || {},
            body = '<?xml version="1.0"?><ccRequest>',
            originalCallback = opts.callback,
            originalFail = opts.fail;

        for ( var key in opts.postdata ) {
            body += "<" + key + ">" + opts.postdata[key] + "</" + key + ">";
        }

        opts.postdata = body + "</ccRequest>";
        opts.headers = {
            "X-TURKCELL": "pingpong",
            "Content-Type": "application/xml"
        };

        opts.callback = function(_response) {
            var response = $.parseJSON(_response);

            if ( response.operationResultCode === "0" ) {
                if ( $.isFunction( originalCallback ) ) {
                    originalCallback( response.token );
                }
            } else {
                if ( $.isFunction( originalFail ) ) {
                    originalFail( response.operationResultDescription );
                }
            }
        };
        
        if ( window.XDomainRequest ) {
            var xdr = new XDomainRequest();
            xdr.open("POST", _url);
            xdr.onload = function() {
                 opts.callback(xdr.responseText)
            }

            xdr.send( opts.postdata );
        } else {
            SHOP.getServiceResponse( _url, opts );
        }
    };

    /*
    ** you can pass jquery object or selector
    */
    SHOP.scrollPageToItem = function (item, topMargin, duration) {
        var item$ = (typeof item === "string") ? $(item) : item;

        topMargin = topMargin || 0;
        duration = duration || "fast";
        if ( item$.size() ) {
            $("html, body").animate({
                 scrollTop: ( item$.offset().top - topMargin ) + "px"
             }, duration);
        } else {
            throw "scrollToItem() : passed id could not found";
        }

    };

    SHOP.showErrorModal = function (errorMessage,callback) {
    	var tealium_error_obj = {}; // FT266698
    	
    	tealium_error_obj.Error_name = typeof errorMessage === 'object' ? errorMessage : (errorMessage != null ? errorMessage.replace(/<\/?[^>]+(>|$)/g, "") : '');
    	//Html tagler ucuruluyor
    	tealium_error_obj.Error_path = window.location.pathname;
    	tealium_error_obj.pageName = "teklif_uygun_degil";
    	tealium_error_obj.page_type = "teklif_uygun_degil";
    	var productName = $("#shopDeviceDetailTealiumData").data("productTitle");
    	var category = $("#shopDeviceDetailTealiumData").data("productCategory");
    	var brand = $("#shopDeviceDetailTealiumData").data("brand");
    	var pmId = $("#shopDeviceDetailTealiumData").data("productId");
    	tealium_error_obj.product_name = [productName];
    	tealium_error_obj.product_category = [category];
    	tealium_error_obj.product_brand = [brand];
    	tealium_error_obj.product_id = [pmId];
    	SHOP.pushTealiumState(tealium_error_obj);
    	
        var errorModal$ = $("#shop_error_modal"),
            descriptionArea$ = $("#shop-error-message-header"),
            okBtn$ = $("#err-ok-btn");

        // TODO: get default error message from CMS
        descriptionArea$.html( errorMessage || "Hata olustu!");
        if(typeof callback != undefined) {
        	okBtn$.click(callback);
        }
        errorModal$.modal();
    };
    
    SHOP.showErrorMnt = function (errorMessage) {
    	
        var errorModal$ = $("#shop_error_modal"),
            descriptionArea$ = $("#shop-error-message-header");

        descriptionArea$.html( errorMessage || "Hata olustu!");
        errorModal$.modal();
    };

    SHOP.showSuccessModal = function(successMessage) {
        var successModal$ = $("#shop_success_modal"),
            descriptionArea$ = $("#shop-success-message-header");

        // TODO: get default error message from CMS
        descriptionArea$.html( successMessage || "İşleminiz başarıyla gerçekleştirildi");
        successModal$.modal();
    };

    SHOP.getSecureUrlProtocol = function() {
        // when dev mode is on
        // url protocol should be http
        return ( SHOP.isDevModeActive ) ? "http:" : "https:";
    };

    SHOP.createFullUrlFromRelativePath = function( relativePath ) {
        var protocol = SHOP.getSecureUrlProtocol(),
            action = protocol  + "//" + location.host + relativePath;

        if ( SHOP.isDevModeActive && !SHOP.isNoneLoginSale) {
            action += "?msisdn=" + SHOP.msisdn;
        }

        return action;
    };

    SHOP.login = function( _button, _executeSuccess ) {
        if ( ! $.isFunction( _executeSuccess ) || ! _button.length ) {
            throw "executeSuccess method and login button must be defined!";
        }

        LoginClient.executeSuccess = function( msisdn ) {
            SHOP.msisdn = msisdn;
            _executeSuccess();
        };

        var login_type = $(_button).data("login-type");
        var button_id = "#" + $(_button).data("login-button-id");

        if (login_type === "ldap") {
            LoginClient.ldapLogin( $(button_id) );
        } else {
            LoginClient.mConnectLogin({ button: $(button_id) });
        }
    };

    SHOP.generateValidateMessagesObject = function( container$ ) {
        var messages = {};

        $("input, select, textarea", container$).each(function() {
            var this$ = $(this),
                name = this$.attr("name"),
                required = this$.data("required"),
                validateMessages = this$.data("validateMessages"),
                namespace = {};

            if ( validateMessages ) {
                namespace = validateMessages;
            }

            if ( required ) {
                namespace.required = required;

                // set basic messages as required text
                namespace.minlength = required;
                namespace.valueNotZero = required;
            }

            if ( ! $.isEmptyObject(namespace) ) {
                messages[ name ] = namespace;
            }
        });

        return messages;
    };

    SHOP.initJQueryValidate = function( form$, conf, _isFormInModal ) {
        var getDisplayedElement = function( element$ ) {
                var id = element$.attr("id");

                if ( element$.data("errorTarget") ) {
                    element$ = $( element$.data("errorTarget") );
                } else if ( element$.is("select") ) {
                    element$ = $( "#trk_dropdown_" + id );
                } else if ( element$.is("[type=checkbox]") ) {
                    element$= $("label[for=" + id + "] span");
                } else if ( element$.is("[type=radio]") ) {
                    element$ = $(".tab-pane.active");
                }

                return element$;
            },

            isFormInModal = ( _isFormInModal === true ),

            validateMessages = SHOP.generateValidateMessagesObject( form$ ),

            // default options
            opts = {
                ignore : "input[type=hidden]",
                focusInvalid : false,
                hidingType : "display", /* custom option */

                submitHandler : function( form ) {
                    form.submit();
                },

                invalidHandler: function( form, validator ) {
                    if ( isFormInModal || !validator.numberOfInvalids() ) {
                        return;
                    }

                    var firstErrorElement$ = getDisplayedElement( $(validator.errorList[0].element) );
                    SHOP.scrollPageToItem( firstErrorElement$, 100 );
                },

                messages : validateMessages,

                rules : conf.rules,

                errorPlacement: function(error, element) {
                    if ( element.is(".no-warning") ) {
                        return;
                    }

                    var errorHolder$ = element.parent().find(".error-holder");

                    if ( errorHolder$.length === 0 ) {
                        errorHolder$ = element.closest(".error-holder-container").find(".error-holder");
                    }

                    // if error-holder-container is not available
                    if ( errorHolder$.length === 0 ) {
                        element.after( error );
                    }

                    errorHolder$.replaceWith( error );
                },

                highlight : function(element, errorClass) {
                    var element$ = $(element);
                    getDisplayedElement( element$ ).addClass( errorClass );
                },

                unhighlight : function(element, errorClass) {
                    var element$ = $(element);
                    getDisplayedElement( element$ ).removeClass( errorClass );
                }
            };

        if ( conf.hidingType ) {
            opts.hidingType = conf.hidingType;
        }

        if ( conf.submitHandler ) {
            opts.submitHandler = conf.submitHandler;
        }

        if ( conf.groups ) {
            opts.groups = conf.groups;
        }

        if ( conf.errorElement ) {
            opts.errorElement = conf.errorElement;
        }

        if ( conf.ignore === "none" ) {
            opts.ignore = "";
        }

        form$.validate( opts );
    };

    SHOP.miniCart = {

        miniCartSelector : "#dropbox-cart",
        miniCartButton$ : $("a[href='#dropbox-cart']"),
        cartCount$ : $("span.cart-count"),
        updateLogArray : [],

        init : function () {
            var self = this;

            $(function () {
                if ( SHOP.isUserLoggedIn() || SHOP.existNoneLoginSaleUser) {
                	self.updateMiniBasket();
                }
            });

            return self;
        },

        deleteLineItem : function($button, id, basketId, colorId, successCallback) {
            var self = this;
            
            if($button){
	           var $loadingGif =  $($button).closest(".cart-tr").find(".delete-loading");
	           $loadingGif.removeClass("hidden");
        	}
        	var deleteLineItemUrl = '/'+SHOP.formPath+'/deleteLineItem';
           SHOP.getJSONObject(deleteLineItemUrl , {
                type: "GET",
                postdata : "bli=" + id + "&bid=" + basketId,
                callback : function ( resultObject ) {
                    var errorMessage = resultObject.exceptionMsg;

                    if (errorMessage) {
                    	SHOP.showErrorModal( errorMessage );
                    } else {
                    	var miniCartButton$ = self.miniCartButton$;
                        self.updateMiniBasket(false, new function() {
                        	var $color = $("#color-"+(colorId == -1 ? '' : colorId));
                        	if($color){
                        		$color.attr("data-cash-added",false);	
                        		var buyButtonCash$ = $("#productDetailBuyButtonCash");
                        		
                        		if($color.hasClass("checked")){
                        			 buyButtonCash$.text( buyButtonCash$.data("buttonText") ).prop("disabled", false);
                        		}
                        	}else{ // kontratli : color gonderilmiyor
                        		var buyButtonContracted$ = $("#productDetailBuyButton");
                        		if($color.hasClass("checked")){
                        			buyButtonContracted$.text( buyButtonContracted$.data("buttonText") ).prop("disabled", false);
                        		}
                        	}
                        	
                        	var $reloadBasketDiv = $("#reloadBasketDiv");
                        	if($reloadBasketDiv){
                        		$reloadBasketDiv.trigger("change");
                        	}
                        	
	                    	 if ( $.isFunction( successCallback ) ) {
	                             successCallback();
	                         }
                        	 
						});
                    }
                }
            });
        },
        deleteBasket : function(deleteButton$, successCallback ) {
        	var deleteBasketUrl = '/'+SHOP.formPath+'/deleteBasket';
            SHOP.getJSONObject(deleteBasketUrl , {
                type: "GET",

                callback : function ( resultObject ) {
                    if (resultObject.isSuccess &&  $.isFunction( successCallback ) ) {
                        successCallback();
                        return;
                    }

                    var errorMessage = resultObject.exceptionMsg;
                    
                    
                    if ( errorMessage ) {
                       SHOP.showErrorModal( errorMessage );
                    }
                    
                    deleteButton$.removeClass("disabled");
                }
            });
        },
        updateLineItem : function( bliId,amount, callback){
        	var updateLineItemUrl = '/'+SHOP.formPath+'/updateLineItem';
        	SHOP.getJSONObject(updateLineItemUrl , {
        		type: "GET",

        		postdata : "bli=" + bliId + "&amount=" + amount,

        		callback : function ( resultObject ) {
        			var errorMessage = resultObject.exceptionMsg;

        			if ( errorMessage ) {
        				SHOP.showErrorModal( errorMessage );
        				callback(false);
        			} else {
        				callback(true);
        			}
        		},
        		fail : function () {
        			SHOP.showErrorModal("Hata olustu!");
        		}
        	});

        },
        updateMiniBasket : function(showBasketAfterLoad, successCallback) {
            return;
            var self = this;
            var getMiniCartUrl = '/'+SHOP.formPath+'/getMiniCart';
            
            SHOP.getServiceResponse(getMiniCartUrl + "?pageUrl="+window.location.pathname, {
                popErrorMessages : false,

                type : "GET",
                cache : false,

                callback : function ( response ) {
                    var target$ = $( self.miniCartSelector ),
                        miniCart$ = $( response ),
                        miniCartButton$ = self.miniCartButton$,
                        totalItems = miniCart$.data("totalItems");

                    miniCartButton$
                        .addClass("dropbox_btn")
                        .attr("href", self.miniCartSelector );

                    if ( totalItems === 0 ) {
                        miniCartButton$.removeClass("has-items");
                        self.cartCount$.addClass("hidden");
                    } else {
                        miniCartButton$.addClass("has-items");
                        self.cartCount$.removeClass("hidden");
                        self.cartCount$.text( totalItems );
                    }

                    if ( target$.length ) {
                        if ( target$.find(".scroll-container").length ) { // dropbox area is already inited
                            target$.find(".wrap").replaceWith( miniCart$.find(".wrap") );
                        } else {
                            target$.replaceWith( miniCart$ );
                        }
                    }

                    if ( showBasketAfterLoad === true ) {
                        miniCartButton$.trigger("click");
                        $(".js-buy-button.loading-active").deactivateLoading();

                        // use updateLogArray to manage sequential setTimeout calls
                        self.updateLogArray.push( 1 );

                    }

                    if ( $.isFunction( successCallback ) ) {
                        successCallback();
                    }
                }
            });
        }

    }.init();

})(SHOP, jQuery);