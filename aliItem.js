'use strict'

const https = require('https');
const uuid = require('uuid');

class AliItem {
    
    constructor(aliData){
        this.name = aliData.titleModule.subject, 
        this.price = aliData.priceModule.formatedActivityPrice,
        this.description = aliData.pageModule.description,
        this.variants = aliData.skuModule.productSKUPropertyList.map((p) => {
            let property = {};
            property.name = p.skuPropertyName;
            property.variants = p.skuPropertyValues.map((v) => {
                let variant = {};
                variant.name = v.propertyValueDisplayName;
                variant.image = v.skuPropertyImagePath;
                return variant;
            })    
            return property;
        }),
        this.images = aliData.imageModule.imagePathList
    }

    toSquareItem = () => {
        let categoryItem = {"idempotency_key" : uuid()};
        let object = {"type": "ITEM",
            "id" : `#${this.name}`,
        };
        let itemData = {
            "name" : this.name,
            "description" : this.description,
            "image" : this.image,
        }
        if(this.variants.length > 0){
            let addOptions = this.variants.map(v => {
                let option = {id : `#${v.name}`, type : "ITEM_OPTION"}
                let variants = v.variants.map( w => {
                    let info = {
                        name : w.name,
                        type : "ITEM"
                    }
                    if(v.image != null){
                        info.image = w.image;
                    }
                    return info;
                });
                variation.item_variation_data = variants;
                return variation;
            })
            itemData.item_options_data = addOptions;
        }
        object.item_data = itemData;
        categoryItem.object = object;
        return categoryItem;
    }
}

exports.AliItem = AliItem;

const scrape = (data) => {
    try{
        // remove the dangling comma and all redundant stuff after and return
        let cleaned = data.match(/data:[\s\S]*?};/g)[0].replace(/[\n\r]/g, '');
        return JSON.parse(cleaned.slice(6, cleaned.lastIndexOf('},')+1));
    } catch (e){
        // if Aliexpress schema changes will not crash but return JSON parsing error
        return e;
    }
}

const getItemId = (url) => url.match(/item\/[0-9]*\.html/g)[0].replace(/\D/g,'');

exports.get = async (event, context) => new Promise((resolve, reject) => {
    
    let itemId = false;
    
    try{
        itemId = getItemId(event.url);
    } catch(e){
        itemId = false;
    }
    
    if(itemId){
    const params = {
	host: "www.aliexpress.com",
	path: `/item/${itemId}.html`,
	port: 443,
	method: "GET",
	};	
    
    
    const req = https.request(params, function(res) {
        let data = '';
        console.log('STATUS: ' + res.statusCode);
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            console.log("DONE");
            let ali = new AliItem(scrape(data.toString()));
            console.log(ali.toSquareItem().object.item_data.variations[0].item_data);
            resolve(ali);
        });
    });
    req.end();
    } else {
        resolve('something bad happened')
    }
    
});