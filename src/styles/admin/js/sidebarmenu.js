/*
Template Name: Admin Template
Author: Wrappixel
File: js
Combined sidebar functionality and initialization
*/

import $ from 'jquery';

const SidebarManager = (function() {
  "use strict";
  
  // Private methods
  const highlightActiveMenu = function() {
    const url = window.location + "";
    const path = url.replace(
      window.location.protocol + "//" + window.location.host + "/",
      ""
    );

    const element = $("ul#sidebarnav a").filter(function() {
      return this.href === url || this.href === path;
    });

    element.parentsUntil(".sidebar-nav").each(function(index) {
      if ($(this).is("li") && $(this).children("a").length !== 0) {
        $(this).children("a").addClass("active");
        $(this).parent("ul#sidebarnav").length === 0
          ? $(this).addClass("active")
          : $(this).addClass("selected");
      } else if (!$(this).is("ul") && $(this).children("a").length === 0) {
        $(this).addClass("selected");
      } else if ($(this).is("ul")) {
        $(this).addClass("in");
      }
    });

    element.addClass("active");
  };

  const setupMenuClickHandlers = function() {
    $("#sidebarnav a").on("click", function(e) {
      if (!$(this).hasClass("active")) {
        // hide any open menus and remove all other classes
        $("ul", $(this).parents("ul:first")).removeClass("in");
        $("a", $(this).parents("ul:first")).removeClass("active");

        // open our new menu and add the open class
        $(this).next("ul").addClass("in");
        $(this).addClass("active");
      } else if ($(this).hasClass("active")) {
        $(this).removeClass("active");
        $(this).parents("ul:first").removeClass("active");
        $(this).next("ul").removeClass("in");
      }
    });

    $("#sidebarnav >li >a.has-arrow").on("click", function(e) {
      e.preventDefault();
    });
  };

  // Public API
  return {
    init: function() {
      highlightActiveMenu();
      setupMenuClickHandlers();
    },
    
    destroy: function() {
      $("#sidebarnav a").off('click');
      $("#sidebarnav >li >a.has-arrow").off('click');
    }
  };
})();

// Initialize when DOM is ready
$(document).ready(function() {
  SidebarManager.init();
});

// Export for React components (if needed)
export default SidebarManager;