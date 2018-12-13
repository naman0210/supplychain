/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write your transction processor functions here
 */

/** 
 * Transaction to create an item
 * @param {org.supplychain.createItem} tx
 * @transaction
 */

 async function createItem(tx) {
     const factory = getFactory();
     const NS = "org.supplychain";

     var item= factory.newResource(NS,'Item')

     item.item_ID = tx.item_ID;
     item.name = tx.name;
     item.date = new Date().toISOString().slice(0, 10);
     item.producer = factory.newRelationship(NS,'Producer',tx.producer); //tx.producer should just be the id of the producer

     //JavaScript Promises
     return getAssetRegistry(NS,'.Item')
     .then(function(assetRegistry){
        assetRegistry.add(item);
     });
 }

 /**
  * Transaction to create a shipper from producer to processor
  * @param {org.supplychain.createshipperfromproducertoprocessor} tx
  * @transaction
  */

  async function createshipper(tx){
    const factory = getFactory();
    const NS = "org.supplychain";

    var shipper = factory.newResource(NS,'Shipper_from_producer_to_processor');
    shipper.GST_number = tx.GST_number; 
    shipper.name = tx.name;
    shipper.email = tx.email;
    shipper.location = tx.location;

    shipper.producer = factory.newRelationship(NS,'Producer',tx.producer) //tx.producer should just be the id of the producer

    //JavaScript Promises
    return getParticipantRegistry(NS,)
  }
