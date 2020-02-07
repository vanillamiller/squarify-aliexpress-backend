
'use strict';
const https = require('https');
let Item = require('./item.js').Item;

const params = {
  host: "connect.squareupsandbox.com",
  path: "/v2/catalog/batch-upsert",
  port: 443,
  method: "POST",
  headers: {
    "Square-Version" : "2020-01-22",
    "Content-type" : "application/json",
    "Authorization" : "Bearer EAAAENsJsS5blWbXBwJJqMB97a6teeX8y2JxuBjMO35HZuXUSlN5bIPnqFn1MhJp"
  }
};

exports.post = async (event, context, callback) => new Promise((resolve, reject) => {

    const itemFromEventJson = JSON.parse(event['body'])['itemFromClient'];
    const body = JSON.stringify(Item.fromJson(itemFromEventJson).toSquareItem());
    
    const req = https.request(params, (res) => {
      let resbody = '';
      res.on('data', function (chunk) {
              resbody += chunk;
            console.log(resbody);
            });
             
      res.on('end', (chunk) => 
      resolve({statusCode : res.statusCode,
              headers : {
                'Access-Control-Allow-Origin': '*',
                'Content-type' : 'application/json'
              },
              body : resbody
          }));
            
    }).on('error', (e) => {
      reject({
        statusCode : req.statusCode,
        headers : {
          'Content-type' : 'application/json'
        },
        body : ''
      });
    });
        
    // send the request
    req.write(body);
    req.end();
    
});
