/**
 * @module Tooltip
 * @author javier.rocamora@gmail.com
 * Attaches a tooltip to an element.
 */

define(function () {
	"use strict";

	var zIndexCounter = 6;

	// Minimum width of tooltip in pixels, since it can be resized to fit screen
	var minWidth = 130;

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

	TooltipClass.prototype.changeOrientation = function (newOrientation) {
		this.config.orientation = newOrientation;
		var classlist = this.node.classList;
		classlist.remove('left');
		classlist.remove('right');
		classlist.remove('top');
		classlist.remove('bottom');
		classlist.add(newOrientation);
	}

    // Restrict size if Tooltip is too big (or viewport too small)
    TooltipClass.prototype.restrictWidth = function (elementLeft, elementWidth) {

        var tooltipWidth = this.node.clientWidth;
		var windowWidth = window.innerWidth;

		// Check if tooltip fits in the viewport, left or right side
		if (this.config.orientation === "left" || this.config.orientation === "right") {
			var elementRight = windowWidth - (elementLeft + elementWidth);
			var spaceForTooltip = (this.config.orientation === "right") ? elementRight : elementLeft;
			var arrowHorizontal = arrowSize*2;
			if (spaceForTooltip < tooltipWidth + arrowHorizontal) {
				if (spaceForTooltip < minWidth + arrowHorizontal) {
					this.changeOrientation('top');
				} else {
					tooltipWidth = spaceForTooltip - arrowHorizontal;
				}
			}
		}

		// Check if tooltip is wider than the viewport (top/bottom), only for really small screens
		if (this.config.orientation === "top" || this.config.orientation === "bottom") {
			if (windowWidth < tooltipWidth) {
				tooltipWidth = (windowWidth < minWidth) ? minWidth : windowWidth;
			}
		}

		this.node.style.width = tooltipWidth + "px";
        return tooltipWidth;
    };

	/**
	 * If tooltip is out of viewport, put it back in. Also repositions arrow to align with the element
	 */
    TooltipClass.prototype.fitInViewHorizontal = function (tooltipLeft, tooltipWidth) {
        var scrollLeft = window.pageXOffset;
		var arrowLeft = this.arrow.offsetLeft;

        // Tooltip is partially out of viewport (left)
        var offsetLeft =  scrollLeft - tooltipLeft;
        if (offsetLeft > 0) {
            tooltipLeft = scrollLeft;
            // Reposition the arrow to the original snap point, with a limit
            var limitLeft = arrowSize * 2;
            arrowLeft -= offsetLeft;
            arrowLeft = (arrowLeft < limitLeft) ? limitLeft : arrowLeft;

        } else {
            // Tooltip is partially out of viewport (right)
            var tooltipRight = tooltipLeft + tooltipWidth;
            var offsetRight = tooltipRight - (window.innerWidth + scrollLeft);
            if (offsetRight > 0) {
                tooltipLeft = tooltipLeft - offsetRight;
                // Reposition the arrow to the original snap point, with a limit
                var limitRight = tooltipWidth - arrowSize*2;
                arrowLeft += offsetRight;
                arrowLeft = (arrowLeft > limitRight) ? limitRight : arrowLeft;
            }
        }
		this.arrow.style.left = arrowLeft + "px";

		return tooltipLeft;
    };

	/**
	 * Automatically position tooltip, depending on orientation
	 */
	TooltipClass.prototype.absolutePositioning  = function () {
		// Reset previously set styles, in case of resizing
		this.arrow.style.left = "";
		this.node.style.width = "";

		var element = this.element;
		var left = element.offsetLeft,
			top = element.offsetTop,
			width = element.clientWidth,
			height = element.clientHeight,
           	tooltipHeight, tooltipTop, tooltipLeft;

        var tooltipWidth = this.restrictWidth(left, width);

        tooltipHeight = this.node.clientHeight;
		switch(this.config.orientation) {
			case 'left':
				tooltipLeft = left - tooltipWidth - arrowSize - 5;
				tooltipTop = top - (tooltipHeight/2 - height/2);
				break;
			case 'right':
				tooltipLeft = left + width + arrowSize + 5;
				tooltipTop = top - (tooltipHeight/2 - height/2);
				break;
			case 'bottom':
				tooltipTop = top + height + arrowSize + 5;
				tooltipLeft = left - (tooltipWidth/2 - width/2) + arrowSize;
				// Reposition tooltip if out of viewport
				tooltipLeft = this.fitInViewHorizontal(tooltipLeft, tooltipWidth);
				break;
			case 'top':
			default:
				tooltipTop = top - tooltipHeight - arrowSize - 5;
                tooltipLeft = left - (tooltipWidth/2 - width/2) + arrowSize;
				// Reposition tooltip if out of viewport
				tooltipLeft = this.fitInViewHorizontal(tooltipLeft, tooltipWidth);
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

		this.node.style.visibility = "visible";

		// Every new tooltip will be on top of old ones
		this.node.style.zIndex = zIndexCounter++;
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