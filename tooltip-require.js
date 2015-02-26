/**
 * @module Tooltip
 * @author javier.rocamora@gmail.com
 * Attaches a tooltip to an element.
 */

define('Tooltip', function () {

	"use strict";

	/**
	 * Constructor for TooltipClass
	 * @class Every tooltip is an instance of TooltipClass
	 * TODO : Class could be in a separated file
	 */
	function TooltipClass (element) {
		this.element = element;
		// Default config
		this.config = {
			position: 'auto',
			class: '',
			orientation: '',
			showOn: 'hover',
			closeIcon: true			
		};

		// Will contain the tooltip DOM Node
		this.node = null;
		this.arrow = null;
	}

	var arrowSize = 10;  // px

	/** Override default options. Probably there's a better way to do this
	 * @params {object} options An object with the options for the tooltip, possible options are:
	 *  @config {string} [position='auto'] - 'auto' will position the tooltip (absolute) centered close to the element attached to
	 * 					Also normal position values are accepted (relative, absolute, static or fixed)
	 *  @config {string} [class] - Extra class for custom styling
	 *  @config {string} [orientation='top'] - top, bottom, left or right
	 *  @config {string} [showOn='load'] - load|hover|click|... Load will show it from the beginning
	 *  @config {boolean} [closeIcon=true] - If to show Close icon on the tooltip	 
	 */
	TooltipClass.prototype.setOptions = function (options) {
		var config = this.config;
		if (options) {
			if(options.class) {
				config.class = options.class;
			}
			if(options.orientation) {
				config.orientation = options.orientation;
			}			
			if(options.position) {
				config.position = options.position;
			}
			if(options.showOn) {
				config.showOn = options.showOn;
			}
			if(options.closeIcon !== undefined) {
				config.closeIcon = options.closeIcon;
			}
			if(options.text) {
				config.text = options.text;
			}
		}
	};


	/**
	 * Creates the tooltip node, to be inserted on the DOM. Includes arrow and close icon
	 */
	TooltipClass.prototype.createTooltipNode = function (text) {
		var tooltip = document.createElement("div"),
			arrow = document.createElement("div"),
			close = document.createElement("a"),
			config = this.config,
			self = this;

		tooltip.className = config.orientation + " tooltip "+ config.class;

		if (config.closeIcon) {
			close.className = "close";
			close.href = "#";
			close.textContent = "✖";
			close.addEventListener('click', function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				self.hide();
			}, false);
			tooltip.appendChild(close);
		}

		arrow.className = "arrow";		
		tooltip.appendChild(arrow);

		if (!text) {
			if (!config.text) {
				text = "This tooltip text must be set with title or data-tooltip attribute";
			}
			else {
				text = config.text;
			}
		}

		tooltip.appendChild(document.createTextNode(text));
		// Make it focusable
		tooltip.tabIndex = -1;

		this.node = tooltip;
		this.arrow = arrow;

		return tooltip;
	};


	/**
	 * Automatically position tooltip, depending on orientation
	 */
	TooltipClass.prototype.absolutePositioning  = function () {
		var element = this.element;
		var left = element.offsetLeft,
			top = element.offsetTop,
			width = element.clientWidth,
			height = element.clientHeight,
			tooltipWidth = this.node.clientWidth,
			tooltipHeight = this.node.clientHeight,
			tooltipTop, tooltipLeft;

		switch(this.config.orientation) {
			case 'left':
				tooltipLeft = left - tooltipWidth - arrowSize;
				tooltipTop = top - (tooltipHeight/2 - height/2);
				break;
			case 'right':
				tooltipLeft = left + width + arrowSize;
				tooltipTop = top - (tooltipHeight/2 - height/2);
				break;
			case 'bottom':
				tooltipTop = top + height + arrowSize;
				tooltipLeft = left - (tooltipWidth/2 - width/2);
				break;
			case 'top':
			default:
				tooltipTop = top - tooltipHeight - arrowSize;
				tooltipLeft = left - (tooltipWidth/2 - width/2);
				break;
		}

		this.node.style.top = tooltipTop + "px" ;
		this.node.style.left = tooltipLeft + "px" ;
	};


	/**
	 * Automatically position arrow for the tooltip, for tooltip position != 'auto'
	 * ONLY for orientation bottom/top. TODO for left/right
	 */
	TooltipClass.prototype.arrowAutoPositioning = function () {
		if (this.config.arrowLeft !== "") return;

		var left = this.element.offsetLeft,
			width = this.element.clientWidth;

		if (this.config.orientation === "top" || this.config.orientation === "bottom") {
			this.arrow.style.left = (left + width/2 - this.node.offsetLeft) + "px";
		}
	};


	/**
	 * Attach event to the element to show the tooltip
	 */
	TooltipClass.prototype.attachEvents = function () {

		var self = this,
			element = this.element,
			config = this.config;

		// Create closure on event handlers, also useful for detaching the events when destroying the tooltip
		self.listenerShow = function (evt) {
			evt.preventDefault();
			evt.stopPropagation();
			self.show();
		};
		self.listenerHide = function (evt) {
			evt.preventDefault();
			evt.stopPropagation();
			self.hide();
		};

		if (config.showOn === "hover") {
			element.addEventListener('mouseover', this.listenerShow, false);
			element.addEventListener('mouseout', this.listenerHide, false);
		} else if(config.showOn !== "load" ) {
			// Standard event
			element.addEventListener(config.showOn, this.listenerShow, false);
			this.node.addEventListener('blur', this.listenerHide, true);
		}

	};


	/**
	 * Show the tooltip. This creates the node every time is called.
	 */
	TooltipClass.prototype.destroyEvents = function () {
		var config = this.config;

		if (config.showOn === "hover") {
			this.element.removeEventListener('mouseover', this.listenerShow, false);
			this.element.removeEventListener('mouseout', this.listenerHide, false);
		} else if (config.showOn === "focus") {
			this.element.removeEventListener('focus', this.listenerShow, false);
			this.element.removeEventListener('blur', this.listenerHide, false);
		} else if (config.showOn !== "load") {
			this.element.removeEventListener(config.showOn, this.listenerShow, false);
			document.body.removeEventListener('click', this.bodyClickListener, false);
		}
	};

	/**
	 * Show the tooltip. Uses visibility instead of display, to correct calculation of position.
	 */
	TooltipClass.prototype.show = function () {
		this.node.style.visibility = "visible";
		// Can't focus on an invisible element
		this.node.focus();
	};

	/**
	 * Hides the tooltip. If was set on load, destroys the tooltip.
	 */
	TooltipClass.prototype.hide = function () {
		if (this.config.showOn === "load") {
			this.destroyEvents();
			this.node.parentNode.removeChild(this.node);
		} else {
			this.node.style.visibility = "hidden";
		}
	};


	/********  End of TooltipClass **********/





	/*
	 * Tooltip Module: A factory that returns an object of type TooltipClass
	 */

	// Object module to return
	var Tooltip = {};

	/*
	 * Creates a tooltip next to an element
	 * @return {TooltipClass} - Tooltip object.
	 */
	Tooltip.create = function (element, options) {
		if (!element) {
			console.error("Tooltip: Invalid element, needs a DOM Node as 1st argument");
			return null;
		}
		if (!isVisible(element)) {
			console.error("Tooltip: Can't attach a tooltip to an invisible element ->", element );
			return null;
		}

		// Does the tooltip already exist ?
		var existing = element.parentNode.querySelector(".tooltip");
		if (existing) {
			console.log("Tooltip: Already existing tooltip on element. Caller should use Tooltip.destroy before adding new one ->", element );
			existing.parentNode.removeChild(existing);
		}

		var tooltip = new TooltipClass(element);
		tooltip.setOptions (options);

		tooltip.createTooltipNode(element.getAttribute('title'));

		// Attach to the element
		element.parentNode.appendChild (tooltip.node);

		if(tooltip.config.showOn === 'load') {
			tooltip.show();
		} else {
			tooltip.hide();
			tooltip.attachEvents();
		}

		if (tooltip.config.position === 'auto') {
			tooltip.absolutePositioning();
		} else {
			tooltip.arrowAutoPositioning();
		}

		return tooltip;
	};


	/*
	 * Destroys the tooltip and removes the events
	 */
	Tooltip.destroy = function (tooltip) {
		tooltip.destroyEvents();
		tooltip.node.parentNode.removeChild(tooltip.node);
	};


	/**
	 *  Check if element is visible on the page
	 */
	function isVisible(elem) {
		return elem.offsetWidth > 0 || elem.offsetHeight > 0;
	}


	/* Init tooltip by default for elements with data-tooltip attributes 
	* data-tooltip is expected to have a hardcoded JSON object 
	*/
	
	
	var elements = document.querySelectorAll ("[data-tooltip]");
	for (var i= 0, len = elements.length; i < len; i++) {
		var config = elements[i].getAttribute("data-tooltip");
		if (config) {
			config = JSON.parse(config);
		} else {
			config = undefined;
		}
			
		Tooltip.create(elements[i], config);
	}


	return Tooltip;
});
