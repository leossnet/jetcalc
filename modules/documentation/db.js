var  mongoose   = require('mongoose');
var  async   = require('async');
var  _   = require('lodash');
var GridFs = require(__base+'src/gfs.js');
var fs       = require( "fs" );
var config       = require(__base+ "/config.js" );

module.exports = {
	models:{
		docpage:{
			Code: {type: String,required: true,trim: true,unique: true,index: true, role:'code'},
			Name: {type: String,required: true,trim: true, role:'name'},
			Text: {type: String,trim: true},
			LocalText: {type: String,trim: true}
		}
	},
	schema: {
		docpage:function(schema){

			var toLocalUrls = function(Page,done){
				var bookPath = __base+'/gitbook/';
				var imageRegexp = /!\[.*?\]\((.+?)\)/g;
				var Text = _.clone(Page.Text);
				var images = Text.match(imageRegexp);
				if (_.isEmpty(images)) return done(null,Text);
				async.each(images,function(image,cb){
						var id = null;
						try{
							id = _.last(image.match(/\((.*?)\)/)[1].split("/gfs/"));
						} catch(e){
							return cb();
						}
						if (_.isEmpty(id)) return cb();
						GridFs.ToDisk(id,bookPath+'images',function(err, newFile){
							if (err) return cb(err);
							var B = _.last(newFile.split("/"));
							Text = Text.replace(image,'[![Local Image](./images/'+B+')]('+config.portalname+'/docview/'+Page.Code+'/report'+')')
							return cb();
						});
					},function(err){
						return done(err,Text);
				})
			}

			schema.post('save', function(){
				var self = this;
				var bookPath = __base+'/gitbook/';
				var fileName = bookPath+self.Code+'.md';
				toLocalUrls(self,function(err,LT){
					self.LocalText = LT;
					fs.writeFile(fileName, LT, 'utf8', function(err){
						if (err) {
				            return console.log(err);
				        }
					})
				});
			});


			return schema;
		}
	}
}

