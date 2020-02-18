
'use strict';
const fetch = require('node-fetch')
let Item = require('./serverless-functions/items/item').Item;
const jwt = require('./serverless-functions/auth/jwtModule');
const decrypt = require('./serverless-functions/auth/encryption').decrypt;
const FormData = require('form-data');
const real = "squareup";
const sandbox = "squareupsandbox";

let params = {
  host: `connect.${real}.com`,
  path: "/v2/catalog/batch-upsert",
  port: 443,
  method: "POST",
  headers: {
    "Square-Version": "2020-01-22",
    "Content-type": "application/json",
  }
};

const generateSuccessResponse = (successfulItem) => ({
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Content-type': 'application/json'
  },
  body: JSON.stringify(successfulItem),
})

const errorResponse = {
  statusCode: 500,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Content-type': 'application/json'
  },
  body: JSON.stringify({ message: 'something went wrong with your authorization token!' })
};

const getImageType = (imageUrl) => imageUrl.split('.').pop();

const generateContentTypeHeader = (imageType) => {
  switch (imageType) {
    case 'jpg' || 'jpeg' || 'JPEG':
      return 'image/JPEG';
    case 'png' || 'PNG':
      return 'image/PNG';
    case 'gif' || 'GIF':
      return 'image/GIF';
    case 'pjpeg' || 'PJPEG':
      return 'image/PJPEG'
    default:
      throw Error('unknown image extension');
  }
};

const post = async (event) => {

  const itemFromEventJson = JSON.parse(event['body'])['itemFromClient'];
  const itemObject = new Item(itemFromEventJson);
  const body = JSON.stringify(itemObject.toSquareItem());
  const encodedjwt = event['headers']['Authorization'];
  let decodedjwt;

  try {
    decodedjwt = jwt.verify(encodedjwt)
  } catch (e) {
    console.log(e)
  }

  const decryptedSquareOauth2Token = decrypt(decodedjwt.squareInfo.access_token);
  params.headers.Authorization = `Bearer ${decryptedSquareOauth2Token}`;

  const postItemToSquare = async () => fetch(`https://connect.${real}.com/v2/catalog/batch-upsert`,
    {
      method: 'post',
      body: body,
      headers: params.headers
    })
    .then(res => res.json())
    .then(json => console.log('here in res' + JSON.stringify(json)))
    .catch(err => console.log(err));
  
  const getAliImage = fetch(itemObject.image).then(res => res.buffer()).catch(err => console.log(err));

  postItemToSquare();
  // Promise.all([postItemToSquare, getAliImage])
  //   .then(
  //     ([postItemToSquare, getAliImage]) => {
  //       const itemIdMap = postItemToSquare.id_mappings.filter(obj => obj.client_object_id === `#${itemObject.name}`)[0];
  //       const imageFormJson = {
  //         "idempotency_key": uuid(),
  //         "object_id": itemIdMap,
  //         "image": {
  //           "id": "#TEMP_ID",
  //           "type": "IMAGE",
  //           "image_data": {
  //             "caption": itemObject.name
  //           }
  //         }
  //       };
  //       const formData = new FormData();
  //       formData.append('request', imageFormJson);
  //       formData.append('file', aliImage);

  //       const headers = {
  //         "Content-type": generateContentTypeHeader(getImageType(itemObject.image)),
  //         "Content-Disposition": `form-data; name="${itemObject.name}"; filename="${itemObject.name.strip(' ')}.${getImageType(itemObject.image).toLowerCase()}"`
  //       }

  //       fetch('https://connect.squareupsandbox.com/v2/catalog/images',
  //         {
  //           method: 'post',
  //           body: formData,
  //           headers: headers
  //         })
  //         .then(
  //           res => res.json()
  //         )
  //         .then(json => console.log(json))
  //         .catch(
  //           err => console.log(err)
  //         )
  //     }
  //   ).catch(err => console.log(err));
};

const mockEvent = {
  headers: {
    Authorization: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzcXVhcmVJbmZvIjp7ImFjY2Vzc190b2tlbiI6IlBGQXdJNVdFWDlaZStLNlNrMWd1eC9YeEVuUytVOGlFWGpIZkN5YzNCbFJ2UkIzL1k3b3krVktqK09vQVY2TnorbytnR0krZG1RTFVpelo1Qk9BcnFHVUg2K1NPdHJMUXF5NVJiMW1ZbGlrK1lGRTNoSnYwckJtV2diTGtWa2JuYzR6NTgzaXdzblRGczRCbW1XLy9KUGt4eEZZbVA5SkRnZUJtQXJtd3VGMnBCekFhRXdGYzFuVE81a1I4STRkbzRIY0s4NVJHQmFQcUhTcDVHRG5hOVE9PSIsInRva2VuX3R5cGUiOiJiZWFyZXIiLCJleHBpcmVzX2F0IjoiMjAyMC0wMy0xOVQxMTozNjoxNloiLCJtZXJjaGFudF9pZCI6IjhGMzQ5QkZCSjVGVzEiLCJyZWZyZXNoX3Rva2VuIjoibmJETGpraUxYM1JieVl5OHBLTERYS2s2QjFnbmdCWE9Ib1hodStTa2pQajhiNHU2NnFBUktucXRJUDhtZzBEODlYNmt6S3B1Z1dJMldYNlY0UUp0K0Mvb0Q5Z1ltZWFRWGR5MTRJRVJTRkZkM3NoeDk4UENxdTBCRnVvQTN5dmZoTml0MDIrVTNaU2Evb0dhanh4VXgya2RLdys5UGpUS1huYnljNnFZTVp2TGNYaWc1NEVnZStRZ2dUMmlOeGVoZjYwZkVDb0t6bStkYldNL3oyd3dXdz09In0sInNjb3BlcyI6WyJpdGVtcyJdLCJpYXQiOjE1ODIwMjU3NzZ9.hQh_NMb7lxQT3avnmGquycGUlVqdl-pzgxuuracRv50exgbrwMQhSXJe8n8lrI7QPPMUtX3kOKj4BIVCzMYu7Wp5QZa3Q4wz8x6FXXxHviP_b7CRtZ7HTXloKhrjZesq38lMKQGvnOZnZ6q9uwnhQ_9gSD5Thf4gIhfeAHC_SaQ"
  },
  body: JSON.stringify({
    itemFromClient: {
      "id": 4000050168302,
      "name": "New NAVIFORCE Top Luxury Brand Men Watch Quartz Male Clock Design Sport Watch Waterproof Stainless Steel Wristwatch Reloj Hombre",
      "desc": "Cheap Quartz Watches, Buy Directly from China Suppliers:New NAVIFORCE Top Luxury Brand Men Watch Quartz Male Clock Design Sport Watch Waterproof Stainless Steel Wristwatch Reloj Hombre Enjoy âFree Shipping Worldwide! âLimited Time SaleÂ âEasy Return.",
      "image": "https://ae01.alicdn.com/kf/H57e996575d70408baf051fcaeda766e0l/2019-Elastic-Mens-T-Shirt-V-Neck-Long-Sleeve-Men-T-Shirt-For-Male-Lycra-And.jpg_640x640.jpg",
      "options": [
        {
          "name": "Color",
          "values": [
            {
              "name": "BB"
            },
            {
              "name": "SB"
            },
            {
              "name": "BEBE"
            },
            {
              "name": "GG"
            },
            {
              "name": "RGCE"
            }
          ]
        }
      ]
    }
  })
};

post(mockEvent);