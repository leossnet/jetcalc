function TypeNode(code,data) {
    this.code = code;
    this.data = data;
    this.parent = null;
    this.children = [];
}
 
function TypeTree(code, data) {
    var node = new TypeNode(code,data);
    this._root = node;
}

function findIndex(arr, code) {
    var index; 
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].code === code) {
            index = i;
        }
    } 
    return index;
}


function TypeQueue(){var a=[],b=0;this.getLength=function(){return a.length-b};this.isEmpty=function(){return 0==a.length};this.enqueue=function(b){a.push(b)};this.dequeue=function(){if(0!=a.length){var c=a[b];2*++b>=a.length&&(a=a.slice(b),b=0);return c}};this.peek=function(){return 0<a.length?a[b]:void 0}};


TypeTree.prototype.traverseDF = function(callback) {
    (function recurse(currentNode) {
        for (var i = 0, length = currentNode.children.length; i < length; i++) {
            recurse(currentNode.children[i]);
        }
        callback(currentNode);
    })(this._root);
 
};
 
TypeTree.prototype.traverseBF = function(callback) {
    var queue = new TypeQueue();;
    queue.enqueue(this._root);
    currentTree = queue.dequeue();
    while(currentTree){
        for (var i = 0, length = currentTree.children.length; i < length; i++) {
            queue.enqueue(currentTree.children[i]);
        } 
        callback(currentTree);
        currentTree = queue.dequeue();
    }
};

TypeTree.prototype.contains = function(callback, traversal) {
    traversal.call(this, callback);
};
 
TypeTree.prototype.add = function(code, data, toCode, traversal) {
    var child = new TypeNode(code, data),
        parent = null,
        callback = function(node) {
            if (node.code === toCode) {
                parent = node;
            }
        }; 
    this.contains(callback, traversal); 
    if (parent) {
        parent.children.push(child);
        child.parent = parent;
    } else {
        throw new Error('Cannot add node to a non-existent parent.');
    }
};

TypeTree.prototype.getFlat = function(){
    var self = this;
    var FlatTree = [];
    var RebuildTree = function(parent,left){
        parent.lft = left;
        parent.rgt = left + 1;
        var children = _.filter(FlatTree,function(El){
            return El.parent == parent.code;
        })
        if (children.length){
            children.forEach(function(item){
                RebuildTree(item, parent.rgt);
                parent.rgt = item.rgt + 1;
            })
        }
    }
    var SetLevels = function(){
        FlatTree.forEach(function(Node){
            Node.level = _.filter(FlatTree,function(El){
                return El.lft<Node.lft && El.rgt>Node.rgt;
            }).length+1;
        })
    }
    self.traverseBF(function(A){
        if (A.code!='ROOT'){
            FlatTree.push(_.omit(_.merge({code:A.code,parent:A.parent.code},A.data),"Children"));
        }
    })
    RebuildTree({code:'ROOT'},1);
    SetLevels();
    FlatTree = _.sortBy(FlatTree,'lft');
    return FlatTree;
}


TypeTree.prototype.remove = function(code, fromCode, traversal) {
    var tree = this,
        parent = null,
        childToRemove = null,
        index; 
    var callback = function(node) {
        if (node.code === fromCode) {
            parent = node;
        }
    }; 
    this.contains(callback, traversal); 
    if (parent) {
        index = findIndex(parent.children, code); 
        if (index === undefined) {
            throw new Error('Node to remove does not exist.');
        } else {
            childToRemove = parent.children.splice(index, 1);
        }
    } else {
        throw new Error(code+'>> Parent does not exist.'+fromCode);
    } 
    return childToRemove;
};