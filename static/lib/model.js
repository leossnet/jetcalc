var create = (function(){
    var mapping_from_js = function(js) {
        var mapping;
        mapping = this.mapping || {};
        return ko.mapping.fromJS(js, mapping, this);
    };

    var mapping_from_json = function(json) {
        var mapping;
        mapping = this.mapping || {};
        return ko.mapping.fromJSON(json, mapping, this);
    };

    var mapping_to_json = function() {
        return ko.mapping.toJSON(this);
    };

    var mapping_to_js = function() {
        return ko.mapping.toJS(this);
    };

    var apply_diff = function(diff){
        for(var prop in diff){
            if(_.isFunction(this[prop])){
                this[prop](diff[prop])
            }else{
                this[prop]=diff[prop]
            }
        }
    }

    return function(create_class, props, const_props) {
        if(!create_class){
            return null
        }
        var inst = null
        if(!inst){
            inst = new create_class(const_props);
        }
        props = _.merge(const_props,props);
        if (props) {
            var mapping = inst.mapping || {};
            if (typeof props === "string") {
                ko.mapping.fromJSON(props, mapping, inst);
            } else {
                ko.mapping.fromJS(props, mapping, inst);
            }
        }
        inst.toJS = mapping_to_js
        inst.toJSON = mapping_to_json
        inst.fromJS = mapping_from_js
        inst.fromJSON = mapping_from_json
        inst.applyDiff = apply_diff
        return inst;
    };
})();

