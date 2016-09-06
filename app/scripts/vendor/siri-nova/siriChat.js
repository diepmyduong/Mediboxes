
/**
 * config:
 ** label: String (Visible tab; defaults 'Chat to the team!')
 ** widgetWidth: Number (width of chat window - defaults 300(px))
 ** marginFromRight: Number (pixels from right of screen - defaults 50(px))
 ** btnColor: String (css color, defaults - '#3b80c1')
 ** tabColor: String (css color default - '#cd5a54')
 ** srChatActiveColor: String (css color defaults -'#36c498')
 ** userDetailsFooterColor: String (css defaults to '#36c498')
 ** errorColor: String (css defaults to '#cd5a54')
 */


window.siriChat = (function(config) {

  var noop = function() {};
  var _dom = [];
  var upArrow = '&#9650;';
  var downArrow = '&#9660;';
  var widgetWidth = config&&config.widgetWidth||300;
  var screenWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
  var marginFromRight = config&&config.marginFromRight||50;
  var pacing = config&&config.pacing|| 10;

  if((widgetWidth+(marginFromRight*2))>screenWidth) {
    marginFromRight = 20;
    widgetWidth = screenWidth-(marginFromRight*2);
  }

  // --------------------------------------------------
  // -- Request animation frame shim
  // --------------------------------------------------

  (function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); },
          timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }

    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
    }
  }());

  // --------------------------------------------------
  // -- Basic date formatting
  // --------------------------------------------------

  Date.prototype.format = function() {
    var dayNames = ['Chủ Nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    var day = dayNames[this.getDay()];
    var hour = this.getHours();
    var minutes = this.getMinutes();
    return hour + ':' + minutes + ' vào ' + day;
  };


  // --------------------------------------------------
  // -- Element Object
  // --------------------------------------------------

  function Element(type, id) {
    this._elm = document.createElement(type);
    this._elm.setAttribute('id', id);
    this._id = id;
    this._type = type;
    _dom.push(this);
  }

  // Add styles - obj
  Element.prototype.addStyles = function(styles) {
    for (var prop in styles) {
      this._elm.style[prop] = styles[prop];
    }
  };

  // Append child to element
  Element.prototype.append = function(element) {
    this._elm.appendChild(element.getElement());
    return this;
  };

  // Get the DOM element
  Element.prototype.getElement = function() {
    return this._elm;
  };

  // Set inner text
  Element.prototype.setText = function(text) {
    this._elm.innerHTML = text;
  };

  // Set attribute
  Element.prototype.attr = function(attr, val) {
    if(val != undefined){
      this._elm.setAttribute(attr, val);
    }
  };

  // Add event listener
  Element.prototype.on = function(event, cb) {
    this._elm['on' + event] = cb;
  };

  // Is valid email address
  Element.prototype.isValidEmail = function() {
    var email = this.val();
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
  };

  // Vertical animation
  Element.prototype.animateY = function(y, cb) {
    var top = parseInt(this.css('bottom'), 10),
        dy = top - y, i = 1, count = 20, _this = this;

    function frame() {
      if ( i >= count ) { return (cb||noop)(); }
      i += 1;
      _this._elm.style.bottom = (top - (dy * i / count)).toFixed(0) + 'px';
      window.requestAnimationFrame(frame);
    }

    frame();
  };

  // GEt computed css from element
  Element.prototype.css = function(property) {
    return window.getComputedStyle( this._elm, null )
      .getPropertyValue( property );
  }


  // Gets value from field
  Element.prototype.val = function(text) {
    if(typeof text !== 'undefined')
      this._elm.value = text;
    return this._elm.value || false;
  };

  // Get element dimensions
  Element.prototype.height = function() {
    var elmHeight, elmMargin, elm = this._elm;
    if(document.all) {
      elmHeight = parseInt(elm.currentStyle.height.replace('px', ''));
      elmMargin = parseInt(elm.currentStyle.marginTop, 10) + parseInt(
        elm.currentStyle.marginBottom, 10
      );
    } else {
      elmHeight = parseInt(document.defaultView.getComputedStyle(elm, '')
        .getPropertyValue('height').replace('px', ''));

      elmMargin = parseInt(document.defaultView.getComputedStyle(elm, '')
        .getPropertyValue('margin-top')) + parseInt(
          document.defaultView.getComputedStyle(elm, ''
        ).getPropertyValue('margin-bottom'));
    }
    return (elmHeight + elmMargin);
  }

  // Find an element by id
  Element.find = function(id) {
    for (var i = 0; i < _dom.length; i++) {
      if(_dom[i]._id === id) return _dom[i];
    }
  };


  // --------------------------------------------------
  // -- Message element
  // --------------------------------------------------

  function MessageElement(message) {
    var _id = message.id;

    // Create some DOM elements
    var $srChatMssgRow     = new Element('div', 'srChat_mssg_row_'+_id);
    var $srChatMssgWrap    = new Element('div', 'srChat_mssg_'+_id);
    var $srChatMssgAvatar  = new Element('div', 'srChat_mssg_avatar_'+_id);
    var $srChatMssgAvatarImg   = new Element('img', 'srChat_mssg_avatar_img_'+_id);
    var $srChatMssgContent = new Element('div', 'srChat_mssg_content_'+_id);
    var $srChatMssgMeta    = new Element('div', 'srChat_mssg_meta_'+_id);
    

    // Chat message wrapper styles
    $srChatMssgWrap.addStyles({
      'margin': (message.isRight) ? '20px 60px 20px 40px' : '20px 40px 20px 60px',
      'text-align': (message.isRight) ? 'right' : 'left',
      'background':'#fff',
      'margin-bottom':'10px',
      '-webkit-border-radius':'3px',
      '-webkit-border-radius':'3px',
      '-moz-border-radius':'3px',
      '-moz-border-radius':'3px',
      'border-radius':'3px',
      'border-radius':'3px',
    });

    // Chat message content styles
    $srChatMssgContent.addStyles({
      'padding':'7px 10px'
    });

    // Chat message meta styles
    $srChatMssgMeta.addStyles({
      'border-top':'1px solid #eee',
      'margin':'0px 10px',
      'padding':'5px 0px',
      'font-size':'9px',
      'color':'#ccc'
    });

    $srChatMssgAvatar.addStyles({
      'min-height': '40px',
      'min-width': '40px',
      'height': '40px',
      'width': '40px',
      'float': (message.isRight) ? 'right' : 'left',
      'margin-left': (message.isRight) ? '0px' : '10px',
      'margin-right': (message.isRight) ? '10px' : '0px'
    });
    $srChatMssgAvatarImg.addStyles({
      'height': '40px',
      'width':'40px'
    });
    $srChatMssgAvatarImg.attr('sr-src',message.avatarSrc);
    $srChatMssgAvatarImg.attr('class','img-circle');

    // $srChatMssgAvatar
    $srChatMssgContent.setText(message.content);
    $srChatMssgMeta.setText('Gửi bởi ' + message.from + ' at ' + message.date.format());
    $srChatMssgWrap
      .append($srChatMssgContent)
      .append($srChatMssgMeta);
    $srChatMssgAvatar
      .append($srChatMssgAvatarImg);
    $srChatMssgRow
      .append($srChatMssgAvatar)
      .append($srChatMssgWrap);
    return $srChatMssgRow;
  }

  // --------------------------------------------------
  // -- srChat window
  // --------------------------------------------------

  //var $srChat = { _e: $srChatWrap, _isUp: false };
  var $srChat = {_isUp: false};
  $srChat.init = function(callback) {
    console.log("init srChat");
    // --------------------------------------------------
    // -- Build the widget
    // --------------------------------------------------

    // Create elements
    $srChat.$srChatWrap       = new Element('div', 'srChat_wrap_'+parseInt(1000*Math.random()));
    $srChat.$srChatTab        = new Element('div', 'srChat_tab');
    $srChat.$srChatTabText    = new Element('span', 'srChat_tab_text');
    $srChat.$srChatTabClose   = new Element('span', 'srChat_tab_close');
    $srChat.$srChatTabArrow   = new Element('span', 'srChat_tab_arrow');
    $srChat.$srChatTabCall    = new Element('a', 'srChat_tab_call');
    $srChat.$srChatBox        = new Element('div', 'srChat_box');
    $srChat.$srChatFormWrap   = new Element('div', 'srChat_form_wrap');
    $srChat.$srChatForm       = new Element('form', 'srChat_form');
    $srChat.$srChatEmailField = new Element('input', 'srChat_email_field');
    $srChat.$srChatNameField  = new Element('input', 'srChat_name_field');
    $srChat.$srChatMessageBox = new Element('textarea', 'srChat_message_box');
    $srChat.$srChatSubmit     = new Element('input', 'srChat_submit');
    $srChat.$srChatUserDetails= new Element('div', 'srChat_user_details');
    $srChat.$srChatLight      = new Element('span', 'srChat_light');

    // Set attributes if needed
    $srChat.$srChatTabArrow.setText(upArrow);
    $srChat.$srChatTabClose.attr('class','glyphicon glyphicon-remove');
    $srChat.$srChatTabCall.attr('href','https://siri-meet.herokuapp.com/'+config.roomId);
    $srChat.$srChatTabCall.attr('target','_blank');
    $srChat.$srChatTabCall.setText('<span class="fa fa-video-camera"></span>');
    $srChat.$srChatTabText.setText(config&&config.label||'Chat to the team!');
    $srChat.$srChatEmailField.attr('type', 'text');
    $srChat.$srChatEmailField.attr('placeholder', 'Your email');
    $srChat.$srChatNameField.attr('type', 'text');
    $srChat.$srChatNameField.attr('placeholder', 'Your name');
    $srChat.$srChatMessageBox.attr('placeholder', 'Your message');
    $srChat.$srChatSubmit.attr('type', 'submit');
    $srChat.$srChatSubmit.attr('value', 'Send');

    // Add styles
    $srChat.$srChatWrap.addStyles({
      'width':widgetWidth + 'px',
      'background':'#fff',
      'position':'fixed',
      'bottom':'-500px',
      'right':marginFromRight+'px',
      'z-index':'9999',
      '-webkit-border-top-left-radius':'3px',
      '-webkit-border-top-right-radius':'3px',
      '-moz-border-radius-topleft':'3px',
      '-moz-border-radius-topright':'3px',
      'border-top-left-radius':'3px',
      'border-top-right-radius':'3px',
      'overflow':'hidden',
      'display':'none',
      '-webkit-box-shadow':'1px 1px 2px 0px rgba(0,0,0,0.3)',
      '-moz-box-shadow':'1px 1px 2px 0px rgba(0,0,0,0.3)',
      'box-shadow':'1px 1px 2px 0px rgba(0,0,0,0.3)'
    });

    $srChat.$srChatTab.addStyles({
      'padding':'10px 20px',
      'background':config.tabColor||'#cd5a54',
      'color':'#fff'
    });

    $srChat.$srChatLight.addStyles({
      'background':config.srChatActiveColor||'#36c498',
      'margin-right':'10px',
      'width':'10px',
      'height':'10px',
      'display':'inline-block',
      'border-radius':'25px',
      'margin-top':'5px'
    });

    $srChat.$srChatTabArrow.addStyles({
      'color':'#fff',
      'float':'right',
      'margin-left': '10px'
    });
    $srChat.$srChatTabClose.addStyles({
      'color':'#fff',
      'float':'right',
      'margin-left': '10px',
      'padding-top': '2px'
    });
    $srChat.$srChatTabCall.addStyles({
      'color':'#fff',
      'float':'right',
      'margin-left': '10px'
    });

    $srChat.$srChatBox.addStyles({
      'max-height':'150px',
      'overflow':'scroll',
      'font-size':'11px',
      'background':'#eee'
    });

    $srChat.$srChatFormWrap.addStyles({
      'width': widgetWidth + 'px',
      'padding':'10px',
      'bottom':'0px',
      'background':'#fff',
      'left':'0px'
    });

    var srChatInputStyle = {
      'width':(widgetWidth-20)+'px',
      'border':'1px solid #eee',
      'background':'#eee',
      'box-shadow':'none',
      '-webkit-border-radius':'3px',
      '-webkit-border-radius':'3px',
      '-moz-border-radius':'3px',
      '-moz-border-radius':'3px',
      'border-radius':'3px',
      'border-radius':'3px',
      'margin-bottom':'7px',
      'padding':'3px'
    };

    $srChat.$srChatNameField.addStyles(srChatInputStyle);
    $srChat.$srChatEmailField.addStyles(srChatInputStyle);
    $srChat.$srChatMessageBox.addStyles(srChatInputStyle);

    $srChat.$srChatSubmit.addStyles({
      'width':(widgetWidth-20)+'px',
      'border':'none',
      '-webkit-border-radius':'3px',
      '-webkit-border-radius':'3px',
      '-moz-border-radius':'3px',
      '-moz-border-radius':'3px',
      'border-radius':'3px',
      'border-radius':'3px',
      'margin-bottom':'7px',
      'background-color':config.btnColor||'#3b80c1',
      'padding':'7px 0px',
      'color':'#fff',
      'top':'0px'
    });

    $srChat.$srChatUserDetails.addStyles({
      'text-align':'center',
      'background':config.userDetailsFooterColor||'#36c498',
      'color':'#fff',
      'padding':'4px',
      'font-size':'11px',
      'display':'none'
    });

    // Create tree
    $srChat.$srChatTab.append($srChat.$srChatLight);
    $srChat.$srChatTab.append($srChat.$srChatTabText);
    $srChat.$srChatTab.append($srChat.$srChatTabClose);
    $srChat.$srChatTab.append($srChat.$srChatTabArrow);
    $srChat.$srChatTab.append($srChat.$srChatTabCall);
    $srChat.$srChatWrap.append($srChat.$srChatTab);
    $srChat.$srChatWrap.append($srChat.$srChatBox);
    $srChat.$srChatForm.append($srChat.$srChatNameField);
    $srChat.$srChatForm.append($srChat.$srChatEmailField);
    $srChat.$srChatForm.append($srChat.$srChatMessageBox);
    $srChat.$srChatForm.append($srChat.$srChatSubmit);
    $srChat.$srChatFormWrap.append($srChat.$srChatForm);
    $srChat.$srChatWrap.append($srChat.$srChatFormWrap);
    $srChat.$srChatWrap.append($srChat.$srChatUserDetails);


    var _this = this;
    _this._e = $srChat.$srChatWrap;
    // Render the widget on DOM
    document.body.appendChild(_this._e.getElement());

    // Widget events
    _this._events = {
      opened: noop,
      closed: noop,
      formSubmission: noop,
      initialFormSubmission: noop,
      mssgKeyup: noop,
      emailKeyup: noop,
      nameKeyup: noop,
      anySubmission: noop,
      onClose: noop
    };

    // Array of widget messages
    _this._messages = [];

    // Chat user
    _this._user = null;

    /**
     * Add event listeners to DOM elms
     */

    // Tab clicked - toggle the widget
    $srChat.$srChatTab.on('click', function() {
      _this.toggleBox();
    });

    // Form sumitted
    function formSubmit(e) {
      _this._events.anySubmission(e);
      if(this.connectionError) return;
      _this.resetErrorState();

      var formData = _this._getFormData();
      var success = true;

      // If this is the first message callback
      if(!_this._messages.length)
        success = _this._events.initialFormSubmission(formData);

      // On every form submission callback
      if(success) _this._events.formSubmission(formData);

      // Prevent form submission
      e.preventDefault();
    }

    // Call submit on submit event and 'enter'
    $srChat.$srChatForm.on('submit', formSubmit);
    $srChat.$srChatEmailField.on('keyup', this._events.emailKeyup);
    $srChat.$srChatNameField.on('keyup', this._events.nameKeyup);
    $srChat.$srChatMessageBox.on('keydown', function(e) {
      e = e || event;
      if (e.keyCode === 13 && !e.ctrlKey){
        e.preventDefault();
        return formSubmit(e);
      }
      return true;
    });
    $srChat.$srChatMessageBox.on('keyup', function(e) {
      e = e || event;
      $srChat._events.mssgKeyup(e);
      return true;
    });

    // Call on close
    $srChat.$srChatTabClose.on('click', function(e){
      e = e || event;
      $srChat._events.onClose(e);
      return true;
    });

    // Make visible, slide up
    this.display();
    this.showTab(true, function() {
      callback(_this);
    });

    return _this;
  };

  // Returns the form data
  $srChat._getFormData = function() {
    var data = {};

    data.message = $srChat.$srChatMessageBox.val();
    if(data.message){
      data.message = data.message.replace(/(?:\r\n|\r|\n)/g, '');
    }
    data.user = {
      name: $srChat.$srChatNameField.val(),
      email: $srChat.$srChatEmailField.isValidEmail()&&$srChat.$srChatEmailField.val()
    };
    return data;
  };

  // Slides the widget to only show its tab
  $srChat.showTab = function(animated, callback) {
    var wrapHeight = this._e.height();
    var tabHeight = Element.find('srChat_tab').height();
    if(animated !== false) {
      this._e.animateY(tabHeight-wrapHeight, callback);
    } else {
      this._e.addStyles({
        'bottom': (tabHeight-wrapHeight) + 'px'
      });
    }
    return this;
  };

  // Sets the chat user, highlights in widget foot
  $srChat.setUser = function(user) {
    this._user = user;

    if(this._user.name && this._user.email){
      // Add user details below form
      $srChat.$srChatUserDetails.setText('Messaging as ' + user.name + ' : ' + user.email);
      $srChat.$srChatUserDetails.addStyles({
        'display':'block'
      });
      return true;
    }
    return false;
  };

  // Returns user
  $srChat.getUser = function() {
    return this._user;
  };

  // Clear the textarea
  $srChat.clearMessageBox = function() {
    $srChat.$srChatMessageBox.val('');
  };

  // Slide up or down
  $srChat.toggleBox = function(callback) {
    var _this = this;
    if(_this._isUp) {
      this.showTab(true, function() {
        $srChat.$srChatTabArrow.setText(upArrow);
        _this._isUp = false;
        (callback||noop)();
      });
    } else {
      _this._e.animateY(0, function() {
        _this._isUp = true;
        $srChat.$srChatTabArrow.setText(downArrow);
        (callback||noop)();
      });
    }
    return _this;
  };

  // Reset the error formetting
  $srChat.resetErrorState = function() {
    // Reset error mssg background color/hide
    $srChat.$srChatUserDetails.addStyles({
      'background':config.userDetailsFooterColor||'#36c498',
      'display':'none'
    });

    $srChat.$srChatEmailField.addStyles({
      'border':'1px solid #eee'
    });

    $srChat.$srChatNameField.addStyles({
      'border':'1px solid #eee'
    });

    return this;
  };

  // Set error highlighting
  $srChat.setErrors = function(message, nameErr, emailErr) {

    // Set error mssg background color
    $srChat.$srChatUserDetails.addStyles({
      'background':config.errorColor||'#cd5a54'
    });

    // Set message text
    $srChat.$srChatUserDetails.setText(message || 'Form error');

    // If name error set red border
    if(nameErr)
      $srChat.$srChatNameField.addStyles({
        'border':'1px solid ' + (config.errorColor||'#cd5a54')
      });

    // If email error set red border
    if(emailErr)
      $srChat.$srChatEmailField.addStyles({
        'border':'1px solid ' + (config.errorColor||'#cd5a54')
      });

    // Show the user error box
    $srChat.$srChatUserDetails.addStyles({
      'display':'block'
    });

    return this;
  };

  // Show the widget
  $srChat.display = function() {
    this._e.addStyles({display:'block'});
    return this;
  };

  // Hide the widget
  $srChat.hide = function() {
    this._e.addStyles({display:'none'});
    return this;
  };

  $srChat.goLeft = function() {
    var right = parseInt($srChat._e.css('right').replace("px", ""));
    var width = parseInt($srChat._e.css('width').replace("px", ""));
    document.getElementById($srChat._e._id).style.right = width+right+pacing+'px';
  }

  // Validate required message props
  $srChat._validateMessage = function(message) {
    var err = false;
    if(typeof message !== 'object')
      err = true;
    else if(!message.hasOwnProperty('from'))
      err = true;
    else if (!message.hasOwnProperty('content'))
      err = true;
    else if(!message.hasOwnProperty('date'))
      err = true;
    else if(!message.hasOwnProperty('isRight'))
      err = true;
    if(err) console.error('Message is invalid!');
    return err;
  };

  // Scroll to the bottom of the chat box
  $srChat.scrollToBottom = function() {
    $srChat.$srChatBox.getElement().scrollTop = $srChat.$srChatBox.getElement().scrollHeight;
  };

  // Hide/show the user fields
  $srChat.hideUserFields = function(hide) {
    $srChat.$srChatEmailField.addStyles({
      'display':(hide) ? 'none':'block'
    });
    $srChat.$srChatNameField.addStyles({
      'display':(hide) ? 'none':'block'
    });
  };

  // Call 'on' to subscribe to widget events
  $srChat.on = function(event, callback) {
    this._events[event] = callback;
  };

  // Add ui changes if connection is lost
  $srChat.setFormError = function(on, message) {
    if(on) {
      this.connectionError = true;
      $srChat.$srChatSubmit.attr('value', message||'Error!');
      $srChat.$srChatSubmit.addStyles({
        'background':config.errorColor||'#cd5a54',
        'opacity':'0.7'
      });
      $srChat.$srChatSubmit.getElement().disabled = true;
    } else {
      $srChat.$srChatSubmit.attr('value', 'Send');
      this.connectionError = false;
      $srChat.$srChatSubmit.addStyles({
        'background':config.btnColor||'#3b80c1',
        'opacity':'1'
      });
      $srChat.$srChatSubmit.getElement().disabled = false;
    }
  };

  // PRIVATE: count matching elms in array
  $srChat._countOccuranceOf = function(array, condition) {
    var count = 0;
    for (var i = 0; i < array.length; i++) {
      count=condition(array[i]) ? count+1 : count;
    }
    return count;
  };

  // Returns total amount of messages
  $srChat.getTotalMessages = function(isRight) {
    if(typeof isRight === 'undefined')
      return this._messages.length;

    return this._countOccuranceOf(this._messages,
      function(item) {
        return isRight&&item.isRight||!item.isRight;
      });
  };

  // Add message element to widget
  $srChat.addMessage = function(message) {

    /// Check for all required fields
    if(this._validateMessage(message))
      return this._presentError();

    // Uid for message element
    message.id = parseInt(1000*Math.random());

    // Create the message element
    var $mssg = new MessageElement(message);
    // Force open the 'Messaging as' box
    this.setUser(this._user);

    // Add the message elm to bottom of box
    $srChat.$srChatBox.append($mssg);
    // var avatarEl = angular.element($($mssg.getElement()).find('[sr-src]'));
    // message.compile(avatarEl)(avatarEl.scope);
    // var $scope = angular.element($('#srChat_mssg_avatar_'+message.id)).scope();
    message.compile('#srChat_mssg_avatar_img_'+message.id)(message.scope);
    // message.scope.$appy();
    // $scope.addMessageAvatar('#srChat_mssg_avatar_img_'+message.id);
    // Add the message to local messages
    this._messages.push(message);

    // Make sure that the tab remains down
    if(!this._isUp) this.showTab(false);

    // Scroll to the bottom of the window
    this.scrollToBottom();
  };

  return $srChat;
});
