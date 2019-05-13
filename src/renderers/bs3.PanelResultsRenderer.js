$.extend(true, edges, {
    bs3: {
        newPanelResultsRenderer : function(params) {
            return edges.instantiate(edges.bs3.PanelResultsRenderer, params, edges.newRenderer);
        },
        PanelResultsRenderer : function(params) {
            this.noResultsText = edges.getParam(params.noResultsText, "No results match your search criteria");

            this.guideHeight = edges.getParam(params.guideHeight, 150);

            this.basePadding = edges.getParam(params.basePadding, 5);

            this.minWidth = edges.getParam(params.minWidth, 150);

            this.maxWidth = edges.getParam(params.maxWidth, 250);

            this.minHeight = edges.getParam(params.minHeight, 100);

            this.maxHeight = edges.getParam(params.maxHeight, 200);

            this.aspectPath = edges.getParam(params.aspectPath, "metadata.image.a");

            this.bgColorPath = edges.getParam(params.bgColorPath, "metadata.image.avgcol");

            this.imageFunction = edges.getParam(params.imageFunction, false);

            this.annotationHeight = edges.getParam(params.annotationHeight, 50);

            this.triggerInfiniteScrollWhenRemain = edges.getParam(params.triggerInfiniteScrollWhenRemain, 10);

            // ordered list of rows of fields with pre and post wrappers, and a value function
            // (all fields are optional)
            //
            // [
            // [
            //    {
            //        "pre": '<a href="mailto:',
            //        "field": "email",
            //        "post": '">',
            //        "valueFunction" : fn()
            //    },
            //    {
            //        "field": "email",
            //        "post": '</a>'
            //    }
            //],
            // ...
            // ]
            this.panelDisplay = params.panelDisplay || [];

            // if a multi-value field is found that needs to be displayed, which character
            // to use to join
            this.arrayValueJoin = params.arrayValueJoin || ", ";

            // if a field does not have a value, don't display anything from its part of the render
            this.omitFieldIfEmpty = edges.getParam(params.omitFieldIfEmpty, true);

            this.cursor = 0;

            this.lastLineCursor = 0;

            this.scrollTriggerSelector = false;

            this.scrolling = false;

            this.namespace = "edges-bs3-panel-results";

            this.draw = function() {
                this.cursor = 0;
                this.scrolling = false;

                if (this.component.infiniteScroll) {
                    this.scrollTriggerSelector = edges.css_class_selector(this.namespace, "trigger", this);
                }

                var frag = this.noResultsText;
                if (this.component.results === false) {
                    frag = "";
                }

                var resultsFrag = this._renderResults();
                if (resultsFrag !== "") {
                    frag = resultsFrag;
                }

                // finally stick it all together into the container
                var containerClasses = edges.css_classes(this.namespace, "container", this);
                var container = '<div class="' + containerClasses + '">' + frag + '</div>';
                this.component.context.html(container);

                this._bindInfiniteScroll();
            };

            this._bindInfiniteScroll = function() {
                if (this.component.infiniteScroll) {
                    edges.on(window, "scroll", this, "considerInfiniteScroll");
                }
            };

            this._renderResults = function(params) {
                var frag = "";
                var results = this.component.results;
                if (results && results.length > 0) {
                    var containerWidth = Math.floor(this.component.context.width());

                    // list the css classes we'll require
                    var triggerClass = edges.css_classes(this.namespace, "trigger", this);
                    var triggerRendered = false;

                    // now call the renderer on each image to build the records
                    while (this.cursor < results.length) {
                        this.lastLineCursor = this.cursor; // remember the position of the start of the last line
                        frag += this._renderRow({containerWidth: containerWidth});

                        if (!triggerRendered && this.component.infiniteScroll &&
                                results.length - this.cursor <= this.triggerInfiniteScrollWhenRemain) {
                            frag += '<div class="' + triggerClass + '" style="height: 0px; width: 100%"></div>';
                            triggerRendered = true;
                        }
                    }
                }
                return frag;
            };

            this.considerInfiniteScroll = function() {
                if (this.scrolling) {
                    // we're already working on getting the next page of data
                    return;
                }
                var trigger = this.component.context.find(this.scrollTriggerSelector);
                if (trigger.length === 0 || !this._elementInViewport({element: trigger})) {
                    return;
                }
                this.scrolling = true;
                var callback = edges.objClosure(this, "showMoreResults", false, {previousResultCount : this.component.results.length});
                this.component.infiniteScrollNextPage({callback: callback});
            };

            // FIXME: if the user scrolls the element out of the viewport before the scroll event can be triggered
            // on it, then this may not load the next page of results.  To do that, the user would have to be
            // scrolling incredibly fast, so not an urgent thing to address.
            this._elementInViewport = function(params) {
                var el = params.element[0]; // unwrap the jquery object
                var w = $(window);

                var rect = el.getBoundingClientRect();
                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= w.height() &&
                    rect.right <= w.width()
                );
            };

            this.showMoreResults = function(params) {
                // if there are no new results, that means we scrolled to the end,
                // so delete the trigger so we don't get any more paging requests, and
                // leave it at that.
                var previousResultCount = params.previousResultCount;
                if (previousResultCount >= this.component.results.length) {
                    var trigger = this.component.context.find(this.scrollTriggerSelector);
                    trigger.remove();
                    this.scrolling = false;
                    return;
                }

                // roll back the cursor to the start of the last line, we will begin to redraw from there
                // in case that line was incomplete last time
                var deleteFrom = this.lastLineCursor;
                this.cursor = this.lastLineCursor;

                // render the new results.  The called function works off the cursor, so you will
                // only get a frag that represents the results going forward (this will also include
                // the next page trigger)
                var resultsFrag = this._renderResults();

                // delete the last trigger
                var trigger = this.component.context.find(this.scrollTriggerSelector);
                trigger.remove();

                // delete the last row
                var panelSelector = edges.css_class_selector(this.namespace, "panel", this);
                var panels = this.component.context.find(panelSelector);
                for (var i = deleteFrom; i < panels.length; i++) {
                    $(panels[i]).remove();
                }

                // append the results to the container (including the new trigger)
                var containerSelector = edges.css_class_selector(this.namespace, "container", this);
                var container = this.component.context.find(containerSelector);
                container.append(resultsFrag);

                // bind the infinite scroll and allow it to be used
                this._bindInfiniteScroll();
                this.scrolling = false;

                // in the mean time the user may have scrolled to the end of what we're displaying, so
                // we should trigger a check for more infinite scrolling
                this.considerInfiniteScroll();
            };

            this._caclulateDims = function(params) {
                var containerWidth = params.containerWidth;

                var results = this.component.results;
                var dims = [];

                // first stage is to consume images from the results array until there
                // are none left, or we overflow the available width
                var totalWidth = 0;
                var pads = 0;
                var padding = 0;
                var fullWidth = 0;
                while (true) {
                    if (this.cursor >= results.length) {
                        // there are no more images in the result set
                        break;
                    }
                    var res = results[this.cursor];
                    this.cursor++;

                    // calculate the width and height from the guide height and the aspect ratio
                    var aspect = edges.objVal(this.aspectPath, res);
                    var w = Math.round(this.guideHeight * aspect);
                    var h = this.guideHeight;

                    // if the width exceeds the max width, scale back down to max width (ignoring
                    // min height).
                    if (w > this.maxWidth) {
                        w = this.maxWidth;
                        h = Math.round(w / aspect);
                    }

                    // record the initial dimensions
                    dims.push({w: w, h: h, ow: w, oh: h, pl : this.basePadding, pr: this.basePadding, a: aspect});

                    totalWidth += w;
                    // when there is more than one image, we need to account for 2 padding areas
                    if (dims.length > 1) {
                        pads += 2;
                        padding = pads * this.basePadding
                    }
                    fullWidth = totalWidth + padding;

                    if (fullWidth === containerWidth) {
                        return dims;
                    }
                    if (fullWidth > containerWidth) {
                        break;
                    }
                }

                // set the padding for the end elements
                dims[0].pl = 0;
                dims[dims.length - 1].pr = 0;

                // if we get to here, we have a set of dimensions which are less than or greater than
                // the container width
                var excess = fullWidth - containerWidth;
                if (excess <= 0 && this.cursor >= results.length) {
                    // if the row fits, and there are no more images, don't attempt to
                    // lay it out, just return as-is
                    return dims;
                }

                return this._resizeRow({dims: dims, excess: excess, containerWidth: containerWidth});
            };

            this._resizeRow = function(params) {
                var excess = params.excess;

                if (excess <= 0) {
                    // there is space left, and we need to stretch the images across it
                    return this._stretchRow(params);
                } else {
                    // the images overflow the space and we need to compact them
                    return this._compactRow(params);
                }
            };

            this._compactRow = function(params) {
                var dims = params.dims;
                var excess = params.excess;
                var containerWidth = params.containerWidth;

                // find all the images that are greater than minimum height
                var distribute = [];
                var divisor = 0;
                for (var i = 0; i < dims.length; i++) {
                    var dim = dims[i];
                    if (dim.h > this.minHeight) {
                        divisor += dim.w;
                        distribute.push(dim);
                    }
                }

                var distributed = 0;
                var failed = false;
                for (var i = 0; i < distribute.length; i++) {
                    var dim = distribute[i];
                    var adjustment;
                    if (i < distribute.length - 1) {
                        var proportion = dim.w / divisor;
                        adjustment = Math.round(excess * proportion);
                    } else {
                        // note that we do this one by subtraction to get rid of any differences due
                        // to rounding errors
                        adjustment = excess - distributed;
                    }

                    dim.w = dim.w - adjustment;
                    if (dim.w < this.minWidth) {
                        failed = true;
                        break;
                    }

                    dim.h = Math.round(dim.w / dim.a);
                    if (dim.h < this.minHeight) {
                        failed = true;
                        break;
                    }

                    distributed += adjustment;
                }

                if (failed) {
                    // remove the final element from the array and roll-back the cursor
                    // and reset the right padding on the final element to zero
                    dims.pop();
                    this.cursor--;
                    dims[dims.length - 1].pr = 0;

                    // reset all the remaining elements to their original values
                    var totalWidth = 0;
                    for (var i = 0; i < dims.length; i++) {
                        var dim = dims[i];
                        // reset the properties
                        dim.w = dim.ow;
                        dim.h = dim.oh;
                        totalWidth += dim.w + dim.pl + dim.pr;
                    }

                    // calculate the new excess (which should be negative), and pass it all
                    // on
                    excess = totalWidth - containerWidth;
                    return this._resizeRow({dims: dims, excess: excess, containerWidth: containerWidth});
                }
                return dims;
            };

            this._stretchRow = function(params) {
                var dims = params.dims;
                var shortfall = -1 * params.excess;
                var containerWidth = params.containerWidth;

                // first a repeat application of a distribution of the shortfall until it is
                // all used or all the images exceed max width or max height
                while (true) {
                    // find all the images that are less than max width and less than max height
                    var distribute = [];
                    var divisor = 0;
                    for (var i = 0; i < dims.length; i++) {
                        var dim = dims[i];
                        if (dim.w < this.maxWidth && dim.h < this.maxHeight) {
                            divisor += dim.w;
                            distribute.push(dim);
                        }
                    }

                    // if everyone is at max width, we can't apply this portion of the algoritm
                    // any more
                    if (distribute.length === 0) {
                        break;
                    }

                    var distributed = 0;
                    for (var i = 0; i < distribute.length; i++) {
                        var dim = distribute[i];
                        var adjustment;
                        if (i < distribute.length - 1) {
                            var proportion = dim.w / divisor;
                            adjustment = Math.round(shortfall * proportion);
                        } else {
                            // note that we do this one by subtraction to get rid of any differences due
                            // to rounding errors
                            adjustment = shortfall - distributed;
                        }

                        var initW = dim.w;
                        dim.w = dim.w + adjustment;
                        dim.h = Math.round(dim.w / dim.a);

                        if (dim.w <= this.maxWidth) {
                            if (dim.h <= this.maxHeight) {
                                // the dimensions are within the max height and max width box, so we
                                // have distributed the entire adjustment
                                distributed += adjustment;
                            } else {
                                // the dimensions overflow the max height, so scale back down to max
                                // height and calculate how much adjustment was actually made
                                dim.h = this.maxHeight;
                                dim.w = Math.round(this.maxHeight * dim.a);
                                distributed += (dim.w - initW);
                            }
                        } else {
                            // we have overflowed the max width, so scale back down to max width
                            dim.w = this.maxWidth;
                            dim.h = Math.round(dim.w / dim.a);

                            // then rescale the same as above
                            if (dim.h <= this.maxHeight) {
                                // the dimensions are within the max height and max width box, so
                                // record the exact adjustment we made
                                distributed += (dim.w - initW);
                            } else {
                                // the dimensions overflow the max height, so scale back down to max
                                // height and calculate how much adjustment was actually made
                                dim.h = this.maxHeight;
                                dim.w = Math.round(this.maxHeight * dim.a);
                                distributed += (dim.w - initW);
                            }
                        }
                    }

                    // if we have distributed the entire shorfall we are done
                    if (distributed >= shortfall) {
                        return dims;
                    }

                    // if not, calculate the new shortfall and run another iteration
                    var totalWidth = 0;
                    for (var i = 0; i < dims.length; i++) {
                        var dim = dims[i];
                        totalWidth += dim.w + dim.pl + dim.pr;
                    }
                    shortfall = containerWidth - totalWidth;
                }

                // ensure shortfall is a multiple of the number of paddings
                var pads = (dims.length - 1) * 2;
                var extra = shortfall % pads;
                shortfall -= extra;

                // distribute the remaining shortfall evenly across all non-zero paddings
                if (shortfall > 0) {
                    var pad = shortfall / pads;
                    for (var i = 0; i < dims.length; i++) {
                        var dim = dims[i];
                        if (dim.pl > 0) {
                            dim.pl += pad;
                        }
                        if (dim.pr > 0) {
                            dim.pr += pad;
                        }
                    }
                }

                // distribute the extra pixels by distorting each image by one pixel until we
                // run out of extras.
                while (extra > 0) {
                    for (var i = 0; i < dims.length; i++) {
                        var dim = dims[i];
                        dim.w += 1;
                        extra--;
                        if (extra === 0) {
                            break;
                        }
                    }
                }

                return dims;
            };

            this._renderRow = function(params) {
                var containerWidth = params.containerWidth;

                var initialCursor = this.cursor;
                var dims = this._caclulateDims(params);

                // calculate the tallest image in the row
                var largestHeight = 0;
                for (var i = 0; i < dims.length; i++) {
                    if (dims[i].h > largestHeight) {
                        largestHeight = dims[i].h;
                    }
                }

                var panelClasses = edges.css_classes(this.namespace, "panel", this);
                var containerClasses = edges.css_classes(this.namespace, "img-container", this);
                var annotationClasses = edges.css_classes(this.namespace, "annotation", this);

                var frag = "";
                for (var i = 0; i < dims.length; i++) {
                    var dim = dims[i];
                    var rec = this.component.results[initialCursor + i];

                    var panelStyles = "width: " + (dim.w + dim.pl + dim.pr) + "px; ";
                    panelStyles += "height: " + (largestHeight + this.annotationHeight) + "px";
                    frag += '<div class="' + panelClasses + '" style="' + panelStyles + '">';

                    var containerStyles = "width: 100%; height: " + largestHeight + "px; ";
                    containerStyles += "padding-left: " + dim.pl + "px; ";
                    containerStyles += "padding-right: " + dim.pr + "px; ";
                    containerStyles += "padding-top: " + (Math.ceil((largestHeight - dim.h) / 2)) + "px; ";
                    frag += '<div class="' + containerClasses + '" style="' + containerStyles + '">';

                    var imgStyles = "width: " + dim.w + "px; height: " + dim.h + "px; ";
                    imgStyles += "background-color: " + edges.objVal(this.bgColorPath, rec, "#ffffff") + "; ";

                    var imgData = this.imageFunction(rec, this);
                    var url = imgData.src;
                    var alt = imgData.alt || "";
                    var imgFrag = '<img src="' + url + '" alt="' + alt + '" style="' + imgStyles + '">';
                    if (imgData.a) {
                        imgFrag = '<a href="' + imgData.a + '">' + imgFrag + '</a>';
                    }
                    frag += imgFrag;

                    frag += "</div>";

                    var annotationStyles = "width: 100%; height: " + this.annotationHeight + "px;";
                    var annotation = this._renderAnnotation({record: rec});
                    frag += '<div class="' + annotationClasses + '" style="' + annotationStyles + '">' + annotation + '</div>';

                    frag += "</div>";
                }

                return frag;
            };

            this._renderAnnotation = function(params) {
                var res = params.record;

                var rowClass = edges.css_classes(this.namespace, "annotate-row", this);

                // get a list of the fields on the object to display
                var frag = "";
                for (var i = 0; i < this.panelDisplay.length; i++) {
                    var row = this.panelDisplay[i];
                    var rowFrag = "";
                    for (var j = 0; j < row.length; j++) {
                        var entry = row[j];
                        // first sort out the value, and make sure there is one
                        var val = "";
                        if (entry.field) {
                            val = this._getValue(entry.field, res, val);
                        }
                        if (val) {
                            val = edges.escapeHtml(val);
                        }
                        if (entry.valueFunction) {
                            val = entry.valueFunction(val, res, this);
                        }
                        if (!val && this.omitFieldIfEmpty) {
                            continue;
                        }

                        var fieldClass = "";
                        if (entry.field) {
                            fieldClass = "field_" + edges.safeId(entry.field)
                        }
                        var fieldFrag = '<span class="' + fieldClass + '">';
                        if (entry.pre) {
                            fieldFrag += entry.pre;
                        }
                        fieldFrag += val;
                        if (entry.post) {
                            fieldFrag += entry.post;
                        }
                        fieldFrag += "</span>";
                        rowFrag += fieldFrag;
                    }
                    frag += '<div class="' + rowClass + '">' + rowFrag + '</div>';
                }
                return frag;
            };

            this._getValue = function (path, rec, def) {
                if (def === undefined) { def = false; }
                var bits = path.split(".");
                var val = rec;
                for (var i = 0; i < bits.length; i++) {
                    var field = bits[i];
                    if (field in val) {
                        val = val[field];
                    } else {
                        return def;
                    }
                }
                if ($.isArray(val)) {
                    val = val.join(this.arrayValueJoin);
                } else if ($.isPlainObject(val)) {
                    val = def;
                }
                return val;
            };
        }
    }
});