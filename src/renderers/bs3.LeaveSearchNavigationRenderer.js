$.extend(true, edges, {
    bs3: {
        newLeaveSearchNavigationRenderer: function (params) {
            return edges.instantiate(edges.bs3.LeaveSearchNavigationRenderer, params, edges.newRenderer)
        },
        LeaveSearchNavigationRenderer: function (params) {
            this.text = edges.getParam(params.text, "navigate");

            this.namespace = "edges-leave-search-navigation";

            this.draw = function() {
                var containerClass = edges.css_classes(this.namespace, "container", this);
                var linkClass = edges.css_classes(this.namespace, "link", this);

                var link = this.component.link;
                var frag = '<div class="' + containerClass + '"><a class="btn btn-info btn-sm ' + linkClass + '" href="' + link + '">' + this.text + '</a></div>';

                this.component.context.html(frag);
            }
        }
    }
});