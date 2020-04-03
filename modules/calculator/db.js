//var nestedSet   = require(__base+'/lib/nestedset.js');
var mongoose = require("mongoose");
var _ = require("lodash");
var async = require("async");

module.exports = {
	models:{
		row:{
			lft     : {type: Number, min: 0, extended:true},
  			rgt     : {type: Number, min: 0, extended:true},
  			level   : {type: Number, default: 0, extended:true},
  			rowpath : {type : String  , default : null, extended:true},
  			treeroot : {type : String  , default : null, index: true, extended:true}
		}
	},
	schema: {
		row: function(schema){
		  	schema.index({lft: 1, rgt: 1});
		  	schema.index({rgt: 1});

		  	schema.statics.RebuildTree = function (parent, left, CodeUser, callback) {
				var self = this; parent.lft = left; parent.rgt = left + 1;
				mongoose.model("row").find({CodeParentRow: parent.CodeRow}).isactive().sort('IndexRow').exec(function(err, children) { 				
					if (err) return callback(err); 
					if (!_.isEmpty(children)) {
		                async.forEachSeries(children, function(item, cb) {
		                  self.RebuildTree(item, parent.rgt, CodeUser, function() {
		                    parent.rgt = item.rgt + 1;
		                    parent.userSave(CodeUser,cb);
		                  });
		                }, function(err) {
		                  	callback();
		                });
	              	} else {
	              		parent.userSave(CodeUser,callback);
            		}
				})
		  	}

		  	schema.methods.IndexNewTree = function(CodeUser,done){
		  		this._indexTree(CodeUser,false,done);
		  	}
		  	schema.methods.IndexTree = function(CodeUser,final){
		  		this._indexTree(CodeUser,true,final);
		  	}

		  	schema.methods._indexTree = function(CodeUser,UseOldPath,final){
				var Row = mongoose.model("row");
	  			var RootNode = this;
				RootNode.IndexRow = 0;
				RootNode.level = 0;
				RootNode.treeroot = RootNode.CodeRow;
				RootNode.rowpath = '/'+RootNode.CodeRow+'/';
				var Parents = {}; 
				Parents[(RootNode.level+1)] = RootNode.CodeRow; 
				var ToSave = [RootNode];

				var TreeQuery = UseOldPath ? {OldPathRow:{$regex:new RegExp(".*?\/"+RootNode.CodeRow+"\/.*?")}} : {treeroot:RootNode.CodeRow};
	  			mongoose.model("row").find(TreeQuery).exec(function(err,Children){
	  				if (UseOldPath){
		  				Children = _.sortBy(Children,function(R){
	  					    return Number(R.NumRow.replace(/[^0-9]*/g,''));
						})
	  				} else {
		  				Children = _.sortBy(Children,"IndexRow");
	  				}
	  				var ByParents = {};
	  				Children.forEach(function(C){
	  					ByParents[C.CodeRow] = C.CodeParentRow;
	  				})
	  				var info = function(CodeRow){
	  					var Parents = [], Parent = ByParents[CodeRow];
	  					while (Parent){
	  						Parents.unshift(Parent);
	  						if (Parent == ByParents[Parent]){
	  							break;
	  						}
	  						Parent = ByParents[Parent];
	  					}
	  					return {
	  						Path:'/'+Parents.concat([CodeRow]).join("/")+'/',
	  						Level:Parents.length
	  					}
	  				}
					Children.forEach(function(R,i){
						var Info = info(R.CodeRow);
						R.level = Info.Level;
						Parents[(R.level+1)] = R.CodeRow;				
						R.IndexRow = (++i);
						R.treeroot = RootNode.CodeRow;
						R.rowpath = Info.Path;
						ToSave.push(new Row(R));
					})
					async.each(ToSave,function(M,cb){
						M.userSave(CodeUser,cb);
					},function(err){
						RootNode.BuildTree(CodeUser,function(err){
							return final();
						});
					})
        		})		  		
		  	}


		  	schema.methods.BuildTree = function(CodeUser,final){
		  		var self = this;
		  		schema.statics.RebuildTree(self,1,CodeUser,final)
		  	}

			return schema; 
		}
	}
}

