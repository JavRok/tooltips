/**
 * @module Tooltip
 * @author javier.rocamora@gmail.com
 * Attaches a tooltip to an element.
 */

define(function () {

	"use strict";

	var zIndexCounter = 6;

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
			class: 'darkgrey',
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
	 *  @config {string} [showOn='load'] - load|manual|hover|click|... Load will show it from the beginning. Manual will be controlled outside
	 *  @config {boolean} [closeIcon=true] - If to show Close icon on the tooltip
	 *  @config {boolean} [persistent=false] - If tooltip should stay when clicking outside. False by default, except for showOn=load
	 */
	TooltipClass.prototype.setOptions = function (options) {
		var config = this.config;
		if (options) {
			if(options["class"]) {
				config["class"] = options["class"];
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
			// Let's assume an onLoad should be persistent
			if(options.showOn === "load") {
				config.persistent = true;
			}
			if(options.persistent !== undefined) {
				config.persistent = options.persistent;
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

		tooltip.className = config.orientation + " tooltip "+ config["class"];

		if (!text) {
			if (!config.text) {
				text = "This tooltip text must be set with title or data-tooltip attribute";
			}
			else {
				text = config.text;
			}
		}

		tooltip.innerHTML = text;

		if (config.closeIcon) {
			close.className = "close icon icon_cross";
			close.href = "#";
			// close.textContent = "✖";
			close.addEventListener('click', function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				self.hide();
			}, false);
			// == prepend
			tooltip.insertBefore(close, tooltip.childNodes[0]);
		}

		arrow.className = "arrow";
		tooltip.appendChild(arrow);

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
			tooltipHeight, tooltipTop, tooltipLeft;

		// Tooltip is too big (or viewport too small)
		if (window.innerWidth < tooltipWidth) {
			tooltipWidth = window.innerWidth;
			this.node.style.width = tooltipWidth + "px";
			// tooltipLeft = 0;
		}
		tooltipHeight = this.node.clientHeight;

		switch(this.config.orientation) {
			case 'left':
				tooltipLeft = left - tooltipWidth - arrowSize - 5;
				// if (tooltipLeft < -5) move to right
				tooltipTop = top - (tooltipHeight/2 - height/2);
				break;
			case 'right':
				tooltipLeft = left + width + arrowSize + 5;
				tooltipTop = top - (tooltipHeight/2 - height/2);
				break;
			case 'bottom':
				tooltipTop = top + height + arrowSize + 5;
				tooltipLeft = left - (tooltipWidth/2 - width/2);

				if (tooltipLeft < 0) {
					this.arrow.style.left = tooltipWidth / 2 + tooltipLeft + "px";
					tooltipLeft = 0;
				}

				break;
			case 'top':
			default:
				tooltipTop = top - tooltipHeight - arrowSize - 5;
				tooltipLeft = left - (tooltipWidth/2 - width/2);

				if (tooltipLeft < 0) {
					this.arrow.style.left = tooltipWidth / 2 + tooltipLeft + "px";
					tooltipLeft = 0;
				}
				break;
		}



		// Tooltip is completely out of viewport
		if (tooltipLeft > window.innerWidth) {
			// Change tooltip to left
		}
		if (tooltipLeft + tooltipWidth < 0) {
			// Change tooltip to right
		}

		// Tooltip is partly out of viewport
		var fitsViewportRight = (tooltipLeft + tooltipWidth  <  window.innerWidth + arrowSize);
		if (!fitsViewportRight) {

			// TODO: FIT IT REALLY!
			tooltipLeft = left - tooltipWidth + width / 2 + arrowSize * 3 / 2;
			this.arrow.classList.add('arrow--tight-right');
		} else {
			this.arrow.classList.remove('arrow--tight-right');
		}


		this.node.style.top = tooltipTop + "px" ;
		this.node.style.left = tooltipLeft + "px" ;
	};


	/**
	 * Automatically position arrow for the tooltip, for tooltip position != 'auto'
	 * ONLY for orientation bottom/top. TODO for left/right
	 */
	TooltipClass.prototype.arrowAutoPositioning = function () {

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

		if (config.showOn === "manual") {
			// No events, would be controlled from the outside (with show/hide)
			return;
		}

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
		} else if (config.showOn === "focus") {
			element.addEventListener('focus', this.listenerShow, false);
			element.addEventListener('blur', this.listenerHide, false);
		} else {
			if(config.showOn !== "load") {
				// Standard event
				element.addEventListener(config.showOn, this.listenerShow, false);
			}
			if (!config.persistent) {
				this.node.addEventListener('blur', this.listenerHide, true);
			}
		}

	};


	/*
	 * Destroys the tooltip and removes the events
	 */
	TooltipClass.prototype.destroy = function () {
		destroyEvents(this);
		if (this.node.parentNode) {
			this.node.parentNode.removeChild(this.node);
		}
	};


	/**
	 * Destroys the tooltip events
	 */
	function destroyEvents(tooltip) {
		var config = tooltip.config;

		if (config.showOn === "hover") {
			tooltip.element.removeEventListener('mouseover', tooltip.listenerShow, false);
			tooltip.element.removeEventListener('mouseout', tooltip.listenerHide, false);
		} else if (config.showOn === "focus") {
			tooltip.element.removeEventListener('focus', tooltip.listenerShow, false);
			tooltip.element.removeEventListener('blur', tooltip.listenerHide, false);
		} else if (config.showOn !== "load") {
			tooltip.element.removeEventListener(config.showOn, tooltip.listenerShow, false);
			document.body.removeEventListener('click', tooltip.bodyClickListener, false);
		}
	}

	/*TooltipClass.prototype.destroyEvents = function () {
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
	 };*/




	/*
	 * Hides all the tooltips attached to an element (to show a new one for example)
	 */
	function hideElementTooltips (element) {
		var existing = element.parentNode.querySelectorAll(".tooltip");
		forEach(existing, function (i, node) {
			node.style.visibility = "hidden";
		});
	}


	/**
	 * Show the tooltip. Uses visibility instead of display, to correct calculation of position.
	 */
	TooltipClass.prototype.show = function () {
		if (!isVisible(this.element)) {
			console.error("Tooltip: Can't attach a tooltip to an invisible element ->", element );
			return null;
		}

		if (this.config.position === 'auto' || this.config.position === 'absolute') {
			this.absolutePositioning();
		} else {
			this.node.style.position = this.config.position;
		}

		// Hide first other tooltips attach to the element
		// hideElementTooltips(this.node);

		this.node.style.visibility = "visible";

		// Every new tooltip will be on top of old ones
		this.node.style.zIndex = zIndexCounter++;

		// Can't focus on an invisible element
		/*if (!this.config.persistent) {
		 this.node.focus();
		 }*/

	};

	/**
	 * Hides the tooltip. If was set on load, destroys the tooltip.
	 */
	TooltipClass.prototype.hide = function () {
		if (this.config.showOn === "load") {
			this.destroy();
		} else {
			this.node.style.visibility = "hidden";
		}
	};


	/********  End of TooltipClass **********/


	/*
	 * forEach method for NodeLists, after a querySelectorAll call f.i.
	 */
	function forEach(nodes, callback, scope) {
		for (var i = 0; i < nodes.length; i++) {
			callback.call(scope, nodes[i], i); // passes back stuff we need
		}
	}



	/*
	 * Tooltip Module: A factory that returns an object of type TooltipClass
	 */

	// Object module to return
	var Tooltip = {};

	// TODO: Keep a reference to all created tooltips
	var existingTooltips = [];

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

		// Does the tooltip already exist? We allow several tooltips as long as they have different classes ("error"...)
		var existing = element.parentNode.querySelectorAll(".tooltip");
		forEach(existing, function (node, i) {
			if (options && node.classList.contains(options.class)) {
				node.parentNode.removeChild(node);
			}
		});

		var tooltip = new TooltipClass(element);
		tooltip.setOptions (options);

		tooltip.createTooltipNode(element.getAttribute('title'));

		// Attach next to the element
		element.parentNode.insertBefore (tooltip.node, element.nextSibling);
		// element.parentNode.appendChild (tooltip.node);


		if(tooltip.config.showOn === 'load') {
			tooltip.show();
		} else {
			tooltip.hide();
		}
		tooltip.attachEvents();

		if (tooltip.config.position === 'auto') {
			// tooltip.absolutePositioning();
		} else {
			tooltip.arrowAutoPositioning();
		}

		existingTooltips.push(tooltip);

		return tooltip;
	};


	/*
	 * We want the Object linked to the tooltip Node in the DOM, in case we lost the reference
	 * @param {HTMLElement} The node of the Tooltip (<div class="tooltip">)
	 * @return {Tooltip} or null if not found
	 */
	function getTooltipFromNode(node) {
		for (var i=0; i<existingTooltips.length; i++) {
			if (existingTooltips[i].node == node)
				return existingTooltips[i];
		}
		return null;
	}

	/*
	 * Hides a specific tooltip. Accepts a TooltipClass object or a tooltip node
	 */
	Tooltip.hide = function (tooltip) {

		var tt = tooltip;

		if (!(tooltip instanceof TooltipClass)) {
			tt = getTooltipFromNode(tooltip);
		}

		tt.hide();
	};


	/*
	 * Helper function to remove all active tooltips
	 */
	Tooltip.destroyAll = function () {
		var tooltip;
		while (existingTooltips.length > 0) {
			tooltip = existingTooltips.pop();
			tooltip.destroy();
		}
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