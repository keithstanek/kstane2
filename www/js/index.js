/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener("resume", onResume, false);
        //document.addEventListener("pause", onPause, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

function onPause() {
   cordova.plugins.notification.local.hasPermission(function(granted){
      if(granted == true) {
        schedule(id, title, message, schedule_time);
      } else {
        cordova.plugins.notification.local.registerPermission(function(granted) {
         if(granted == true) {
           schedule(id, title, message, schedule_time);
         } else {
           navigator.notification.alert("Reminder cannot be added because app doesn't have permission");
         }
        });
      }
   });
   //var sound = device.platform == 'Android' ? 'file://sound.mp3' : 'file://beep.caf';
   var t = new Date();
   t.setSeconds(t.getSeconds() + 10);

   cordova.plugins.notification.local.schedule({
       id: 1,
       title: "Message Title",
       message: "Message Text",
       at: t
       //sound: sound,
       //icon: "http://domain.com/icon.png"
   });
}

function onResume() {
   setTimeout(function() {
     // TODO: do your thing!
     window.location.href = "index.html";
   }, 0);
}
