$.extend(!0,edges,{bs3:{newTabbed:function(e){return e||(e={}),edges.bs3.Tabbed.prototype=edges.newTemplate(e),new edges.bs3.Tabbed(e)},Tabbed:function(e){this.edge=!1,this.hidden={},this.namespace="edges-bs3-tabbed",this.draw=function(e){this.edge=e;var i='<div id="edges-tabbed-view">{{TOPSTRAP}}<div class="row">',d=e.category("top"),t="";if(d.length>0)for(var s=0;s<d.length;s++)t+='<div class="row"><div class="col-md-12"><div id="'+d[s].id+'"></div></div></div>';var a=e.category("lhs"),n="";if(a.length>0){i+='<div class="col-md-3">                        <div id="edges-tabbed-controls" style="padding-top:45px;">{{CONTROLS}}</div>                    </div>',i+='<div class="col-md-9" id="edges-tabbed-panel">';for(var s=0;s<a.length;s++)n+='<div id="'+a[s].id+'"></div>'}else i+='<div class="col-md-12" id="edges-tabbed-panel">';var c=e.category("tab");i+='<div class="row">                        <div class="col-md-12">                            <ul class="nav nav-tabs">{{TABS}}</ul>                        </div>                    </div>';for(var r="",o="",b=[],s=0;s<c.length;s++){var l=c[s],v="edges-tabbed-container-"+l.id;b.push(l.id),r+='<li><a href="#" id="edges-tabbed-tab-'+l.id+'" data-id="'+l.id+'"><strong>'+l.display+"</strong></a></li>",o+='<div class="edges-tabbed-container" id="'+v+'">                            <div class="row">                                <div class="col-md-12">                                     <div class="tab" id="'+l.id+'"></div>                                </div>                             </div>                        </div>'}i+="{{TAB_CONTENTS}}</div></div>",i=i.replace(/{{CONTROLS}}/g,n),i=i.replace(/{{TABS}}/g,r),i=i.replace(/{{TAB_CONTENTS}}/g,o),i=i.replace(/{{TOPSTRAP}}/g,t),e.context.html(i);for(var s=0;s<b.length;s++)this.hideOffScreen("#edges-tabbed-container-"+b[s]);var g=b[0];this.activateTab(g);for(var s=0;s<b.length;s++)$("#edges-tabbed-tab-"+b[s],this.edge.context).click(edges.eventClosure(this,"tabClicked"))},this.hideOffScreen=function(e){var i=$(e,this.edge.context);e in this.hidden||(this.hidden[e]={position:i.css("position"),margin:i.css("margin-left")},$(e,this.edge.context).css("position","absolute").css("margin-left",-9999))},this.bringIn=function(e){var i=this.hidden[e].position,d=this.hidden[e].margin;$(e,this.edge.context).css("position",i).css("margin-left",d),delete this.hidden[e]},this.activateTab=function(e){for(var i=this.edge.category("tab"),d=0;d<i.length;d++){var t=i[d];t.id===e?(this.bringIn("#edges-tabbed-container-"+t.id),$("#edges-tabbed-tab-"+t.id,this.edge.context).parent().addClass("active")):(this.hideOffScreen("#edges-tabbed-container-"+t.id),$("#edges-tabbed-tab-"+t.id,this.edge.context).parent().removeClass("active"))}},this.tabClicked=function(e){var i=$(e).attr("data-id");this.activateTab(i)}}}});