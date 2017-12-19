/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
(function(){"use strict";jQuery.sap.declare("cus.sd.salesorder.create.util.Validator");cus.sd.salesorder.create.util.Validator=function(){var i=0;var I=Object.create(null);this.getInvalidControlsNumber=function(){return i;};this.registerInvalidControl=function(k){if(!(k in I)){i++;I[k]=true;}};this.unregisterInvalidControl=function(k){if(k in I){i--;delete I[k];}};};}());
