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
 * This transaction will be invoked by the admin when starting the business network
 * @param {org.supplychain.initiate} tx
 * @transaction
 */

 async function initiate(tx) {
     const factory = getFactory();
     const NS = "org.supplychain";

     //JS promises
     return getAssetRegistry('org.supplychain.config')
     .then(function(assetregistry){
        return assetregistry.getAll();
     })
     .then(function(configs){
        if(configs.length > 0)
            throw new Error("Already initiated");
        else if(tx.type.length != tx.participants.length)
        {
            throw new Error("Length of both the fields should be same");
        }
        else
            return getAssetRegistry('org.supplychain.config')
     })
     .then(function(assetregistry1){
        var config = factory.newResource(NS,'config','1');
        config.participants=tx.participants;
        config.type=tx.type;
         assetregistry1.add(config);
     })
     .catch(function(error){
        console.log(error);
     });
 }

 /**
  * Transaction to add an item 
  * @param {org.supplychain.createItem} tx
  * @transaction
  */

  async function createitem(tx){
    const factory = getFactory();
    const NS = "org.supplychain";

    let currentParticipant = getCurrentParticipant();
    var producer;
    var item = factory.newResource(NS,'Item',tx.item_ID);
    item.item_ID = tx.item_ID;
    item.name = tx.name;
    item.date = tx.timestamp;

    //JS promises
    return getAssetRegistry('org.supplychain.Item')
    .then(function(assetregistry){
        
        if(tx.producer.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
        {
            throw new Error("Not authorised!!");
        }
        item.producer = tx.producer;
        producer = tx.producer;
        return assetregistry.add(item);
    })
    .then(function(){
        console.log("Item asset created and added");
        return getParticipantRegistry("org.supplychain.Producer")
    })
    .then(function(producerparticipantregistry){
        if (typeof producer.items == 'undefined')
        {
            producer.items = new Array();
            producer.availibility = new Array();
            var it = factory.newRelationship(NS,'Item',item.getIdentifier());
            producer.items[0]= it;
            producer.availibility[0] = "Available";
        }
        else{
            var it = factory.newRelationship(NS,'Item',item.getIdentifier());
            producer.items.push(it);
            producer.availibility.push("Available");
        }
        producerparticipantregistry.update(producer);
    })
    .catch(function(error){
        console.log(error);
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

    let currentParticipant = getCurrentParticipant();

    var shipper = factory.newResource(NS,'Shipper_from_producer_to_processor',tx.GST_number);
    shipper.GST_number=tx.GST_number;
    shipper.name=tx.name;
    shipper.email=tx.email;
    shipper.location=tx.location;
    if(tx.producer.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
    {
        throw new Error("Not authorised!!");
    }
    shipper.producer = tx.producer;
    var prod= shipper.producer;
    console.log(prod)

    //JS promises
    return getParticipantRegistry('org.supplychain.Shipper_from_producer_to_processor')
    .then(function(participantregistry){   
        participantregistry.add(shipper);
        return getParticipantRegistry('org.supplychain.Producer')
    })
    .then(function(producerparticipantregistry){
        if (typeof prod.shipperfromproducertoprocessor == 'undefined') {
            prod.shipperfromproducertoprocessor = new Array();
            prod.shipmentnumber = new Array();
            var ship = factory.newRelationship(NS,'Shipper_from_producer_to_processor',shipper.GST_number);
            prod.shipperfromproducertoprocessor[0] = ship;
            prod.shipmentnumber[0] = 0;
        } 
        else {
            var ship = factory.newRelationship(NS,'Shipper_from_producer_to_processor',shipper.GST_number);
            prod.shipperfromproducertoprocessor.push(ship);
            prod.shipmentnumber.push(0);
        }
        producerparticipantregistry.update(prod);
        console.log(prod.shipperfromproducertoprocessor);
    })
    .catch(function(error){
        console.log(error);
    });
 }

 /**
  * Transaction to create a shipment from the producer to processor
  * @param {org.supplychain.createshipmentfromproducertoprocessor} tx
  * @transaction
  */

async function shipmentfromproducertoprocessor(tx){

    //check if the producer exists then 
    //check if the shipper is the one invoking the transaction
    //check if the items belong to his inventory
    //check if the processor is the next in the participant array of config asset
    //get shipping id
    //add shipment
    //increment number of shipments in the producer participant 
    //add shipment number in item assest

    //check if the shipper invoking the transaction is present in the processor's array of shipper
    //(sid will be undefined if isn't present) then throw error 

    const factory = getFactory();
    const NS = 'org.supplychain';

    let currentParticipant = getCurrentParticipant();
    
    var items = tx.items;
    var producer = tx.producer; 
    var processor = tx.processor;
    var typetoconfirm = processor.type;
    var shipper = tx.shipperfromproducertoprocessor;
    var index,sid,ssid;
    var flag=0;
    

    //JS promises
    return getParticipantRegistry('org.supplychain.Producer')
    .then(function(participantregistry){
        return participantregistry.exists(producer.getIdentifier());
    })
    .then(function(exists){
        console.log("Producer exists",exists);
        if(tx.shipperfromproducertoprocessor.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
        {
            throw new Error("Not authorised!!");
        }
        if(!exists)
        {
            throw new Error("Processor doesn't exist");
        }
        for(var i=0;i<items.length;i++)
        {
            flag=0;
            if(items[i].producer.getIdentifier() == producer.getIdentifier())
            {
                flag=1;
                continue;
            }
            if(flag==0)
            {
                throw new Error(items[i].name+"not in the producer inventory");
            }
        }
        return getAssetRegistry('org.supplychain.config')
    })
    .then(function(configassetregistry){
        return configassetregistry.get('1')
    })
    .then(function(config){
        var typetocheck = config.type;
        if(typetocheck[1] !== typetoconfirm)
            throw new Error("This is not the next participant in chain");
        return getParticipantRegistry('org.supplychain.Producer')
    })
    .then(function(producerparticipantregistry){
        
        var itemsbytheproducer = producer.items;
        var availibilityofitems = producer.availibility;
        for(var i=0;i<items.length;i++)
        {
            var indexofitem = itemsbytheproducer.indexOf(items[i]);
            if(availibilityofitems[indexofitem] == "Shipped")
            {
                throw new Error("Item already shipped");
            }
            else{
                producer.availibility[indexofitem] = "Shipped";
            }
        }

        var shippers= producer.shipperfromproducertoprocessor;
        for(var i=0;i<shippers.length;i++)
        {
          if(shippers[i].getIdentifier()==shipper.getIdentifier())
          {
            index=i;
            break;
          }
        }
        if(typeof index == 'undefined')
        {
            throw new Error("Shipper is not a valid shipper of the particular producer");
        }
        sid = producer.shipmentnumber[index];
        if(typeof sid == 'undefined')
        {
            throw new Error("Shipper is not a valid shipper of the particular producer");
        }
        producer.shipmentnumber[index] = producer.shipmentnumber[index]+1;
        producerparticipantregistry.update(producer);
        return getAssetRegistry('org.supplychain.Shipment_from_producer_to_processor')
    })
    .then(function(shipmentassetregistry){
        ssid=sid.toString();
        ssid = ssid+producer.getIdentifier()+processor.getIdentifier();
        var specificshipment = factory.newResource(NS,'Shipment_from_producer_to_processor',ssid);
        specificshipment.shipment_ID=ssid;
        specificshipment.pickup=tx.timestamp;
        specificshipment.items=items;
        specificshipment.shipperfromproducertoprocessor=shipper;
        specificshipment.producer=producer;
        specificshipment.processor=processor;
        return shipmentassetregistry.add(specificshipment);
    })
    .then(function(){
        console.log("Shipment added");
        return getAssetRegistry('org.supplychain.Item')
    })
    .then(function(itemassetregistry){
        for(var i=0;i<items.length;i++)
        {
            items[i].shipment_from_producer_to_processor = factory.newRelationship(NS,'Shipment_from_producer_to_processor',ssid);
        }
        itemassetregistry.updateAll(items);
    })
    .catch(function(error){
        console.log(error);
    });
}


/**
 * Transaction to enter delivered date for the shipment from producer to processor
 * @param {org.supplychain.delveryconfirmedbyproducertoprocessorshipper} tx
 * @transaction
 */

 async function delveryconfirmed(tx){
    const factory = getFactory();
    const NS = 'org.supplychain';

    //enter delivered date for the entered shipment
    //update the items in the processors inventory

    var shipment = tx.shipmentfromproducertoprocessor;
    var processor = shipment.processor;
    var shipmentitems = shipment.items;
    var item;
    let currentParticipant = getCurrentParticipant();
    var shipper=shipment.shipperfromproducertoprocessor;
    //JS promises
    return getAssetRegistry('org.supplychain.Shipment_from_producer_to_processor')
    .then(function(shipmentregistry){
        if(shipper.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
        {
            throw new Error("Unauthorised to add the delivery date");
        }
        if(typeof shipment.delivered_date != 'undefined')
        {
            throw new Error("Delivery already confirmed");
        }
        shipment.delivered_date = tx.timestamp;
        shipmentregistry.update(shipment);
        return getParticipantRegistry('org.supplychain.Processor')
    })
    .then(function(processorregistry){
        if (typeof processor.items == 'undefined') {
            processor.items = new Array();
            processor.itemavailibility = new Array();
            processor.items[0] = factory.newRelationship(NS,'Item',shipmentitems[0].getIdentifier());
            processor.itemavailibility[0] = "Unused"
            for(var i=1;i<shipmentitems.length;i++){
                item = factory.newRelationship(NS,'Item',shipmentitems[i].getIdentifier());
                processor.items.push(item);
                processor.itemavailibility.push("Unused");
            }
        } 
        else {
            for(var i=0;i<shipmentitems.length;i++){
                item = factory.newRelationship(NS,'Item',shipmentitems[i].getIdentifier());
                processor.items.push(item);
                processor.itemavailibility.push("Unused");           
            }
        }
        processorregistry.update(processor);
    })
    .catch(function(error){
        console.log(error);
    });
 }

 /**
  * Transaction to create a product
  * @param {org.supplychain.createproduct} tx
  * @transaction
  */
 
  async function productcreation(tx){ 
    const factory = getFactory();
    const NS ='org.supplychain';

    var useditems = tx.items;
    var processor = tx.processor;
    var pid = tx.product_ID;
    var flag;
    var itemswithprocessor = processor.items;
    let currentParticipant = getCurrentParticipant();

    //add QI
    //check if the items entered are in the inventory of the particular processor
    var product = factory.newResource(NS,'Product',pid);
    var qualityinspector = factory.newResource(NS,'QI','7734');

    //JS promises
    return getAssetRegistry('org.supplychain.Product')
    .then(function(productregistry){
        if(currentParticipant.getFullyQualifiedIdentifier() !== processor.getFullyQualifiedIdentifier())
        {
            throw new Error("Not authorised to enter the product");
        }
        for(var i =0;i<useditems.length;i++)
        {
            flag=0;
            var indextocheck;
            if(typeof itemswithprocessor.length == 'undefined'){
                throw new Error('Processor has no items');
            }
            for(var j=0;j<itemswithprocessor.length;j++)
            {
                if(useditems[i].getIdentifier()==itemswithprocessor[j].getIdentifier())
                {
                    flag=1;
                    break;
                }
            }
            if(flag==0)
            {
                throw new Error("Item not with processor");
            }
            indextocheck = itemswithprocessor.indexOf(useditems[i]);
            if(typeof indextocheck == 'undefined' || processor.itemavailibility[indextocheck] != "Unused")
            {
                throw new Error("Item already used");
            }
        }  
        for(var i =0;i<useditems.length;i++)
        {
            var indextocheck = itemswithprocessor.indexOf(useditems[i]);
            processor.itemavailibility[indextocheck] = "Used";
        }  
        product.qualityinspector = qualityinspector;
        if (typeof product.items == 'undefined') {
            product.items = new Array();
            product.items[0] = factory.newRelationship(NS,'Item',useditems[0].getIdentifier());
            for(var i=1;i<useditems.length;i++){
                item = factory.newRelationship(NS,'Item',useditems[i].getIdentifier());
                product.items.push(item);
            }
        } 
        else {
            for(var i=0;i<items.length;i++){
                item = factory.newRelationship(NS,'Item',useditems[i].getIdentifier());
                product.items.push(item);           }
        }
        if( typeof product.processors =='undefined')
        {
            product.processors = new Array();
            product.processors[0] = factory.newRelationship(NS,'Processor',processor.getIdentifier());
        }
        else{
            var proc = newRelationship(NS,'Processor',processor.getIdentifier());
            product.processors.push(proc);
        }
        return productregistry.add(product);

    })
    .then(function(){
        console.log("Product asset created");
        return getParticipantRegistry('org.supplychain.Processor')
    })
    .then(function(processorparticipantregistry){
        //add the product to the array of products by the processor and set the enum availibility to Available
        if(typeof processor.products == 'undefined'){
            processor.products = new Array();
            processor.availibility = new Array();
            var prod = factory.newRelationship(NS,'Product',product.getIdentifier());
            processor.products[0] = prod;
            processor.availibility[0] = "Available";
        }
        else{
            var prod = factory.newRelationship(NS,'Product',product.getIdentifier());
            processor.products.push(prod);
            processor.availibility.push("Available");
        }
        processorparticipantregistry.update(processor);
    })
    .catch(function(error){
        console.log(error);
    });
  }

  /**
   * Transaction to create shipper from processor
   * @param {org.supplychain.createshipperfromprocessor} tx
   * @transaction
   */

   async function shipperfromprocessor(tx){
    const factory = getFactory();
    const NS ='org.supplychain';

    let currentParticipant = getCurrentParticipant();

    var shipper = factory.newResource(NS,'Shipper_from_processor',tx.GST_number);
    shipper.GST_number=tx.GST_number;
    shipper.name=tx.name;
    shipper.email=tx.email;
    shipper.location=tx.location;
    if(tx.processor.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
    {
        throw new Error("Not authorised!!");
    }
    shipper.initiatingprocessor = tx.processor;
    var proc= shipper.initiatingprocessor;

    //JS promises
    return getParticipantRegistry('org.supplychain.Shipper_from_processor')
    .then(function(participantregistry){   
        participantregistry.add(shipper);
        return getParticipantRegistry('org.supplychain.Processor')
    })
    .then(function(processorparticipantregistry){
        if (typeof proc.shipperfromprocessor == 'undefined') {
            proc.shipperfromprocessor = new Array();
            proc.shipmentnumber = new Array();
            var ship = factory.newRelationship(NS,'Shipper_from_processor',shipper.GST_number);
            proc.shipperfromprocessor[0] = ship;
            proc.shipmentnumber[0] = 0;
        } 
        else {
            var ship = factory.newRelationship(NS,'Shipper_from_processor',shipper.GST_number);
            proc.shipperfromprocessor.push(ship);
            proc.shipmentnumber.push(0);
        }
        processorparticipantregistry.update(proc);
    })
    .catch(function(error){
        console.log(error);
    });
 }


 /**
  * Transaction to create shipment from processor to warehouse
  * @param {org.supplychain.createshipmentfromprocessortowarehouse} tx
  * @transaction
  */

  async function shipmentfromprocessortowarehouse(tx){  
    const factory= getFactory();
    const NS = 'org.supplychain';

    var shippingproducts=tx.products;
    var warehouse = tx.warehouse;
    var processor = tx.initiatingprocessor;

    var pickup = tx.timestamp;
    var shipper = tx.shipperfromprocessor;
    var index,sid,ssid;
    var flag=0;
    let currentParticipant = getCurrentParticipant();

    


    //check if the warehouse exists then 
    //check if the products belong to processor's inventory
    //check if the warehouse is the next in the participant array of config asset
    //check if the product has been approved
    //get shipping id
    //increment number of shipments in the processor participant 
    //add shipment
    //add shipment number in product assest

    //check if the shipper invoking the transaction is present in the processor's array of shipper
    //(sid will be undefined if isn't present) then throw error
    //check if the appropriate shipper invoked the transaction 
    //check if the processor has those products set to Available 

    //JS promises

    return getParticipantRegistry('org.supplychain.Warehouse')
    .then(function(warehouseparticipantregistry){
        return warehouseparticipantregistry.exists(warehouse.getIdentifier())
    })
    .then(function(exists){
        console.log("Warehouse exisits",exists);
        if(shipper.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
        {
            throw new Error("Not Authorised!!!");
        }
        if(!exists)
        {
            throw new Error("Warehouse doesn't exist");
        }
        for(var i=0;i<shippingproducts.length;i++)
        {
            flag=0;
            var len=shippingproducts[i].processors.length;
            var lastprocssorindex = len-1;
            if(shippingproducts[i].processors[lastprocssorindex].getIdentifier() == processor.getIdentifier())
            {
                flag=1;
            }
            if(flag==0)
            {
                throw new Error("The product is not in the inventory of the processor");
            }
        }
        return getAssetRegistry('org.supplychain.config')
    })
    .then(function(configassetregistry){
        return configassetregistry.get('1')
    })
    .then(function(configs){
        var type= processor.type;
        var types= configs.type;
        var indexoftype = types.indexOf(type);
        var warehousetype = warehouse.type;
        var participants = configs.participants;
        resultindex = indexoftype+1;
        if(warehousetype != types[resultindex]  || participants[resultindex] != 'Warehouse'){
            throw new Error('Not the authorised next participant');
        } 
        return getParticipantRegistry('org.supplychain.Processor')
    })
    .then(function(processorregistry){
        for(var i=0;i<shippingproducts.length;i++)
        {
            if(shippingproducts[i].qualitycheck != "Approved"){
                throw new Error("These products have not been approved by the quality inspector");
            }
        }

        var productswithprocessor = processor.products;
        var productsavailibility = processor.availibility;
        for(var i=0;i<shippingproducts.length;i++)
        {
            var productindex = productswithprocessor.indexOf(shippingproducts[i]);
            if(productsavailibility[productindex] == "Shipped")
            {
                throw new Error("Product already shipped");
            }
            processor.availibility[productindex] = "Shipped"
        }
        var shippers = processor.shipperfromprocessor;
        for (var i=0;i<shippers.length;i++)
        {
            if(shippers[i].getIdentifier() == shipper.getIdentifier())
            {
                index =i;
                break;
            }
        }
        if(typeof index == 'undefined')
        {
            throw new Error("Shipper is not a valid shipper of the particular processor");
        }
        sid = processor.shipmentnumber[index];
        if(typeof sid == 'undefined')
        {
            throw new Error("Shipper is not a valid shipper of the particular processor");
        }
        processor.shipmentnumber[index]= processor.shipmentnumber[index]+1;
        processorregistry.update(processor);
        return getAssetRegistry('org.supplychain.Shipment_from_processor')
    })
    .then(function(shipmentassetregistry){
        ssid=sid.toString();
        ssid=ssid+processor.getIdentifier()+warehouse.getIdentifier();
        var shipment = factory.newResource(NS,'Shipment_from_processor',ssid);
        shipment.shipment_ID=ssid;
        shipment.pickup=pickup;
        shipment.products=shippingproducts;
        shipment.initiatingprocessor = processor;
        shipment.warehouse=warehouse;
        shipment.shipperfromprocessor=shipper;

        shipmentassetregistry.add(shipment);
        return getAssetRegistry('org.supplychain.Product')
    })
    .then(function(productassetregistry){
        for(var i=0;i<shippingproducts.length;i++)
        {
            if(typeof shippingproducts[i].shipmentfromprocessor == 'undefined')
            {
                shippingproducts[i].shipmentfromprocessor = new Array();
                shippingproducts[i].shipmentfromprocessor[0] = factory.newRelationship(NS,'Shipment_from_processor',ssid);
            }
            else{
                var ship = factory.newRelationship(NS,'Shipment_from_processor',ssid);
                shippingproducts[i].shipmentfromprocessor.push(ship);
            }
        }
        productassetregistry.updateAll(shippingproducts);
    })
    .catch(function(error){
        console.log(error);
    })
  }   

  /**
   * Transaction to create a shipment from processor to processor
   * @param {org.supplychain.createshipmentfromprocessortoprocessor} tx
   * @transaction
   */

   async function shipmentfromprocessortoprocessor(tx) {
    const factory= getFactory();
    const NS = 'org.supplychain';

    var shippingproducts=tx.products;
    var receivingprocessor = tx.receivingprocessor;
    var initiatingprocessor = tx.initiatingprocessor;

    var pickup = tx.timestamp;
    var shipper = tx.shipperfromprocessor;
    var index,sid,ssid;
    var flag=0;
    let currentParticipant = getCurrentParticipant();


    //check if the receiving processor exists then 
    //check if the products belong to processor's inventory
    //check if the processor is the next in the participant array of config asset
    //get shipping id
    //increment number of shipments in the processor participant 
    //add shipment
    //add shipment number in product assest

    //check if the shipper invoking the transaction is present in the processor's array of shipper
    //(sid will be undefined if isn't present) then throw error 
    //make sure that the shipper entered is right 
    //check if the processor has those products set to Available 


    //JS promises
    return getParticipantRegistry('org.supplychain.Processor')
    .then(function(processorparticipantregistry){
        return processorparticipantregistry.exists(receivingprocessor.getIdentifier())
    })
    .then(function(exists){
        console.log("Processor exisits",exists);
        if(shipper.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
        {
            throw new Error("Not Authorised!!!");
        }
        if(!exists)
        {
            throw new Error("Receiving processor doesn't exist");
        }
        for(var i=0;i<shippingproducts.length;i++)
        {
            flag=0;
            var len=shippingproducts[i].processors.length;
            var lastprocssorindex = len-1;
            console.log(shippingproducts[i].processors[lastprocssorindex]);
            if(shippingproducts[i].processors[lastprocssorindex].getIdentifier() == initiatingprocessor.getIdentifier())
            {
                flag=1;
            }
            if(flag==0)
            {
                throw new Error("The product is not in the inventory of the processor");
            }
        }
        return getAssetRegistry('org.supplychain.config')
    })
    .then(function(configassetregistry){
        return configassetregistry.get('1')
    })
    .then(function(configs){
        var type= initiatingprocessor.type;
        var types= configs.type;
        var indexoftype = types.indexOf(type);
        var receivingprocessortype = receivingprocessor.type;
        var participants = configs.participants;
        resultindex = indexoftype+1;
        if(receivingprocessortype != types[resultindex] || participants[resultindex] != 'Processor'){
            throw new Error('Not the authorised next participant');
        } 

        return getParticipantRegistry('org.supplychain.Processor')
    })
    .then(function(processorregistry){
        var productswithprocessor = initiatingprocessor.products;
        var productsavailibility = initiatingprocessor.availibility;
        for(var i=0;i<shippingproducts.length;i++)
        {
            var productindex = productswithprocessor.indexOf(shippingproducts[i]);
            if(productsavailibility[productindex] == "Shipped")
            {
                throw new Error("Product already shipped");
            }
            initiatingprocessor.availibility[productindex] = "Shipped"
        }
        var shippers = initiatingprocessor.shipperfromprocessor;
        for (var i=0;i<shippers.length;i++)
        {
            if(shippers[i].getIdentifier() == shipper.getIdentifier())
            {
                index =i;
                break;
            }
        }
        if(typeof index == 'undefined')
        {
            throw new Error("Shipper is not a valid shipper of the particular processor");
        }
        sid = initiatingprocessor.shipmentnumber[index];
        if(typeof sid == 'undefined')
        {
            throw new Error("Shipper is not a valid shipper of the particular processor");
        }
        initiatingprocessor.shipmentnumber[index]= initiatingprocessor.shipmentnumber[index]+1;
        processorregistry.update(initiatingprocessor);
        return getAssetRegistry('org.supplychain.Shipment_from_processor')
    })
    .then(function(shipmentassetregistry){
        ssid=sid.toString();
        ssid= ssid+initiatingprocessor.getIdentifier() + receivingprocessor.getIdentifier();
        var shipment = factory.newResource(NS,'Shipment_from_processor',ssid);
        shipment.shipment_ID=ssid;
        shipment.pickup=pickup;
        shipment.products=shippingproducts;
        shipment.initiatingprocessor = initiatingprocessor;
        shipment.receivingprocessor=receivingprocessor;
        shipment.shipperfromprocessor=shipper;
        return shipmentassetregistry.add(shipment);
    })
    .then(function(){
        console.log("Shipment added");
        return getAssetRegistry('org.supplychain.Product')
    })
    .then(function(productassetregistry){
        for(var i=0;i<shippingproducts.length;i++)
        {
            if(typeof shippingproducts.shipmentfromprocessor == 'undefined')
            {
                shippingproducts[i].shipmentfromprocessor = new Array();
                shippingproducts[i].shipmentfromprocessor[0] = factory.newRelationship(NS,'Shipment_from_processor',ssid);
            }
            else{
                var ship = factory.newRelationship(NS,'Shipment_from_processor',ssid);
                shippingproducts[i].shipmentfromprocessor.push(ship);
            }
        }
        productassetregistry.updateAll(shippingproducts);
    })
    .catch(function(error){
        console.log(error);
    })
  }   

  /**
   * Transaction to confirm delivery of a shipment from processor
   * @param {org.supplychain.delveryconfirmedbyprocessorshipper} tx
   * @transaction
   */

   async function deliveryconfirmedbyprocessorshipper(tx){
       const factory = getFactory();
       const NS = 'org.supplychain';

       var shipmentfromprocessor = tx.shipmentfromprocessor;

       var receivingprocessor = shipmentfromprocessor.receivingprocessor;
       var warehouse = shipmentfromprocessor.warehouse;
       var flag;
       var productsreceived = shipmentfromprocessor.products;
       let currentParticipant = getCurrentParticipant();
       var shipper = shipmentfromprocessor.shipperfromprocessor;

       if(typeof warehouse === 'undefined'){
            flag=0;           
       }
       else if (typeof receivingprocessor === 'undefined')
       {      
            flag=1;
       }

       //JS promises
       if(flag==0){
            return getAssetRegistry('org.supplychain.Shipment_from_processor')
            .then(function(shipmentassetregistry){
                if(shipper.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
                {
                    throw new Error("This shipper is not authorised to confirm the delivery");
                }
                if(typeof shipmentfromprocessor.delivered_date != 'undefined')
                {
                    throw new Error("Delivery already confirmed");
                }
                shipmentfromprocessor.delivered_date = tx.timestamp;
                return shipmentassetregistry.update(shipmentfromprocessor)
            })
            .then(function(){
                console.log("Date added");
                return getAssetRegistry('org.supplychain.Product')
            })
            .then(function(productassetregistry){
                for(var i=0;i<productsreceived.length;i++)
                {
                    var proc = factory.newRelationship(NS,'Processor',receivingprocessor.getIdentifier());
                    productsreceived[i].processors.push(proc);
                }
                return productassetregistry.updateAll(productsreceived);
            })
            .then(function(){
                console.log("Product updated ");
                return getParticipantRegistry('org.supplychain.Processor')
            })
            .then(function(processorparticipantregistry){
                if(typeof receivingprocessor.products == 'undefined'){
                    receivingprocessor.products = new Array();
                    receivingprocessor.availibility =new Array();
                    var prod = factory.newRelationship(NS,'Product',productsreceived[0].getIdentifier());
                    receivingprocessor.products[0] = prod;
                    receivingprocessor.availibility[0] = "Available";
                    
                    for(var i=1;i<productsreceived.length;i++)
                    {
                        prod = factory.newRelationship(NS,'Product',productsreceived[i].getIdentifier());
                        receivingprocessor.products.push(prod);
                        receivingprocessor.availibility.push("Available");
                    }
                }
                else{
                    for(var i=0;i<productsreceived.length;i++)
                    {
                        var prod = factory.newRelationship(NS,'Product',productsreceived[i].getIdentifier());
                        receivingprocessor.products.push(prod);
                        receivingprocessor.availibility.push("Available");
                    }
                }
                processorparticipantregistry.update(receivingprocessor);
            })
            .catch(function(error){
                console.log(error);
            })
       }
       else if(flag==1){
        return getAssetRegistry('org.supplychain.Shipment_from_processor')
        .then(function(shipmentassetregistry){
            if(shipper.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
            {
                throw new Error("This shipper is not authorised to confirm the delivery");
            }
            if(typeof shipmentfromprocessor.delivered_date != 'undefined')
            {
                throw new Error("Delivery already confirmed");
            }
            shipmentfromprocessor.delivered_date = tx.timestamp;
            return shipmentassetregistry.update(shipmentfromprocessor)
        })
        .then(function(){
            console.log("Date added");
            return getParticipantRegistry('org.supplychain.Warehouse')
        })
        .then(function(warehouseparticipantregistry){
            if(typeof warehouse.products == 'undefined')
            {
                warehouse.products = new Array();
                warehouse.availibility = new Array();
                var product = factory.newRelationship(NS,'Product',productsreceived[0].getIdentifier());
                warehouse.products[0] = product;
                warehouse.availibility[0] = "Available";
                for(var i=1;i<productsreceived.length;i++)
                {
                    var product = factory.newRelationship(NS,'Product',productsreceived[i].getIdentifier());
                    warehouse.products.push(product);
                    warehouse.availibility.push("Available");
                }
            }
            else{
                for(var i=0;i<productsreceived.length;i++)
                {
                    var product = factory.newRelationship(NS,'Product',productsreceived[i].getIdentifier());
                    warehouse.products.push(product);
                    warehouse.availibility.push("Available");
                }
            }

            return warehouseparticipantregistry.update(warehouse)
        })
        .then(function(){
            console.log("Warehouse updated");
            return getAssetRegistry('org.supplychain.Product')
        })
        .then(function(productassetregistry){
            //add the warehouse to the product assest field warehouses
            for(var i=0;i<productsreceived.length;i++)
            {
                if(typeof productsreceived[i].warehouses == 'undefined')
                {
                    productsreceived[i].warehouses = new Array();
                    var wrhouse = factory.newRelationship(NS,'Warehouse',warehouse.getIdentifier());
                    productsreceived[i].warehouses[0] = wrhouse;
                }
                else{
                    var wrhouse = factory.newRelationship(NS,'Warehouse',warehouse.getIdentifier());
                    productsreceived[i].warehouses.push(wrhouse);
                }
            }
            productassetregistry.updateAll(productsreceived);
        })
        .catch(function(error){
            console.log(error);
        })
    }
   }

   /**
    * Transaction to create shipper from warehouse
    * @param {org.supplychain.createshipperfromwarehouse} tx
    * @transaction
    */

    async function createshipperforwarehouse(tx) {
        const factory = getFactory();
        const NS = 'org.supplychain';

        var GST_number = tx.GST_number;
        var shipper = factory.newResource(NS,'Shipper_from_warehouse',GST_number);
        shipper.GST_number = GST_number;
        shipper.name=tx.name;
        shipper.email=tx.email;
        shipper.location=tx.location;
        let currentParticipant = getCurrentParticipant();

        if(tx.warehouse.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
        {
            throw new Error("Not authorised!!!");
        }
        
        shipper.initiatingwarehouse = tx.warehouse;
        var warehouse = tx.warehouse;

        //JS promises

        return getParticipantRegistry('org.supplychain.Shipper_from_warehouse')
        .then(function(shipperparticipantregistry){
            if(tx.warehouse.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
            {
                throw new Error("Not authorised!!!");
            }
            return shipperparticipantregistry.add(shipper)
        })
        .then(function(){
            console.log("Shipper added");
            return getParticipantRegistry('org.supplychain.Warehouse')
        })
        .then(function(warehouseparticipantregistry){
            if (typeof warehouse.shipperfromwarehouse == 'undefined') {
                warehouse.shipperfromwarehouse = new Array();
                warehouse.shipmentnumber = new Array();
                var ship = factory.newRelationship(NS,'Shipper_from_warehouse',shipper.GST_number);
                warehouse.shipperfromwarehouse[0] = ship;
                warehouse.shipmentnumber[0] = 0;
            } 
            else {
                var ship = factory.newRelationship(NS,'Shipper_from_warehouse',shipper.GST_number);
                warehouse.shipperfromwarehouse.push(ship);
                warehouse.shipmentnumber.push(0);
            }
            warehouseparticipantregistry.update(warehouse);
        })
        .catch(function(error){
            console.log(error);
        });
    }

/**
 * Transaction to make shipment from a warehouse to another warehouse
 * @param {org.supplychain.createshipmentfromwarehousetowarehouse} tx
 * @transaction
 */

 async function shipmentfromwarehousetowarehouse(tx){  
    const factory = getFactory();
    const NS = 'org.supplychain';

    var products = tx.products;
    var initiatingwarehouse=tx.initiatingwarehouse;
    var receivingwarehouse=tx.receivingwarehouse;
    var shipper=tx.shipperfromwarehouse;
    var pickup=tx.timestamp;

    var index,sid,ssid;
    var flag=0;
    let currentParticipant = getCurrentParticipant();

    

    //check if the receiving warehouse exists then 
    //check if the products belong to initiating warehouse's inventory
    //check if the receiving warehouse is the next in the participant array of config asset
    //get shipping id
    //increment number of shipments in the initiating warehouse participant 
    //add shipment
    //add shipment number in product assest

    //check if the shipper invoking the transaction is present in the warehouse's array of shipper
    //(sid will be undefined if isn't present) then throw error
    //make sure that the shipper entered is right 
    //check if the processor has those products set to Available

    //JS promises 

    return getParticipantRegistry('org.supplychain.Warehouse')
    .then(function(warehouseparticipantregistry){
        return warehouseparticipantregistry.exists(receivingwarehouse.getIdentifier());
    })
    .then(function(exists){
        console.log("Receiving warehouse exists",exists);
        if(shipper.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
        {
            throw new Error("Not Authorised!!!");
        }
        if(!exists)
        {
            throw new Error("Receiving warehouse doesn't exist");
        }
        for(var i=0;i<products.length;i++)
        {
            flag=0;
            if(typeof products[i].warehouses == 'undefined')
            {
                throw new Error("Product is not in a warehouse currently");
            }
            var len=products[i].warehouses.length;
            var lastprocssorindex = len-1;
            console.log(products[i].warehouses[lastprocssorindex]);
            if(products[i].warehouses[lastprocssorindex].getIdentifier() == initiatingwarehouse.getIdentifier())
            {
                flag=1;
            }
            if(flag==0)
            {
                throw new Error("The product is not in the inventory of the processor");
            }
        }
        return getAssetRegistry('org.supplychain.config')
    })
    .then(function(configassetregistry){
        return configassetregistry.get('1')
    })
    .then(function(configs){
        var type= initiatingwarehouse.type;
        var types= configs.type;
        var indexoftype = types.indexOf(type);
        var receivingwarehousetype = receivingwarehouse.type;
        var participants = configs.participants;
        resultindex = indexoftype+1;
        if(receivingwarehousetype != types[resultindex] || participants[resultindex] != 'Warehouse'){
            throw new Error('Not the authorised next participant');
        } 

        return getParticipantRegistry('org.supplychain.Warehouse')
    })
    .then(function(warehouseparticipantregistry){
        var productswithwarehouse = initiatingwarehouse.products;
        var availibilityofproducts = initiatingwarehouse.availibility;
        for(var i=0;i<products.length;i++)
        {
            var productindex = productswithwarehouse.indexOf(products[i]);
            if(availibilityofproducts[productindex] == "Shipped")
            {
                throw new Error("Product has already been shipped");
            }
            initiatingwarehouse.availibility[productindex] = "Shipped";
        }
        var shippers = initiatingwarehouse.shipperfromwarehouse;
        for (var i=0;i<shippers.length;i++)
        {
            if(shippers[i].getIdentifier() == shipper.getIdentifier())
            {
                index =i;
                break;
            }
        }
        if(typeof index == 'undefined')
        {
            throw new Error("Shipper is not a valid shipper of the particular warehouse");
        }
        sid = initiatingwarehouse.shipmentnumber[index];
        if(typeof sid == 'undefined')
        {
            throw new Error("Shipper is not a valid shipper of the particular warehouse");
        }
        initiatingwarehouse.shipmentnumber[index]= initiatingwarehouse.shipmentnumber[index]+1;
        warehouseparticipantregistry.update(initiatingwarehouse);
        return getAssetRegistry('org.supplychain.Shipment_from_warehouse')
    })
    .then(function(shipmentassetregistry){
        ssid=sid.toString();
        ssid=ssid+initiatingwarehouse.getIdentifier()+receivingwarehouse.getIdentifier();
        var shipment = factory.newResource(NS,'Shipment_from_warehouse',ssid);
        shipment.shipment_ID=ssid;
        shipment.pickup=pickup;
        shipment.products=products;
        shipment.initiatingwarehouse = initiatingwarehouse;
        shipment.receivingwarehouse=receivingwarehouse;
        shipment.shipperfromwarehouse=shipper;
        return shipmentassetregistry.add(shipment);
    })
    .then(function(){
        console.log("Shipment added");
        return getAssetRegistry('org.supplychain.Product')
    })
    .then(function(productassetregistry){
        for(var i=0;i<products.length;i++)
        {
            if(typeof products[i].shipmentfromwarehouse == 'undefined')
            {
                products[i].shipmentfromwarehouse = new Array();
                products[i].shipmentfromwarehouse[0] = factory.newRelationship(NS,'Shipment_from_warehouse',ssid);
            }
            else{
                var ship = factory.newRelationship(NS,'Shipment_from_warehouse',ssid);
                products[i].shipmentfromwarehouse.push(ship);
            }
        }
        productassetregistry.updateAll(products);
    })
    .catch(function(error){
        console.log(error);
    })
 }

 /**
  * Transaction to create shipment from warehouse to retialer
  * @param {org.supplychain.createshipmentfromwarehousetoretailer} tx
  * @transaction
  */

 async function shipmentfromwarehousetoretailer(tx){  
    const factory = getFactory();
    const NS = 'org.supplychain';

    var products = tx.products;
    var initiatingwarehouse=tx.initiatingwarehouse;
    var retailer=tx.retailer;
    var shipper=tx.shipperfromwarehouse;
    var pickup=tx.timestamp;

    var index,sid,ssid;
    var flag=0;
    let currentParticipant = getCurrentParticipant();


    //check if the retailer exists then 
    //check if the products belong to initiating warehouse's inventory
    //check if the retailer is the next in the participant array of config asset
    //get shipping id
    //increment number of shipments in the initiating warehouse participant 
    //add shipment
    //add shipment number in product assest

    //check if the shipper invoking the transaction is present in the warehouse's array of shipper
    //(sid will be undefined if isn't present) then throw error 
    //make sure that the shipper entered is right 
    //check if the processor has those products set to Available ------left

    //JS promises 

    return getParticipantRegistry('org.supplychain.Retailer')
    .then(function(retailerparticipantregistry){
        return retailerparticipantregistry.exists(retailer.getIdentifier());
    })
    .then(function(exists){
        console.log("Retailer exists",exists);
        if(shipper.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
        {
            throw new Error("Not Authorised!!!");
        }
        if(!exists)
        {
            throw new Error("Retailer doesn't exist");
        }
        for(var i=0;i<products.length;i++)
        {
            flag=0;
            if(typeof products[i].warehouses == 'undefined')
            {
                throw new Error("Product is not in a warehouse currently");
            }
            var len=products[i].warehouses.length;
            var lastprocssorindex = len-1;
            console.log(products[i].warehouses[lastprocssorindex]);
            if(products[i].warehouses[lastprocssorindex].getIdentifier() == initiatingwarehouse.getIdentifier())
            {
                flag=1;
            }
            if(flag==0)
            {
                throw new Error("The product is not in the inventory of the processor");
            }
        }
        return getAssetRegistry('org.supplychain.config')
    })
    .then(function(configassetregistry){
        return configassetregistry.get('1')
    })
    .then(function(configs){
        var type= initiatingwarehouse.type;
        var types= configs.type;
        var indexoftype = types.indexOf(type);
        var participants = configs.participants;
        resultindex = indexoftype+1;
        if(participants[resultindex] != 'Retailer' && retailer.getFullyQualifiedType()().slice(-8) != 'Retailer'){
            throw new Error('Not the authorised next participant');
        } 
        
        return getParticipantRegistry('org.supplychain.Warehouse')
    })
    .then(function(warehouseparticipantregistry){
        var productswithwarehouse = initiatingwarehouse.products;
        var availibilityofproducts = initiatingwarehouse.availibility;
        for(var i=0;i<products.length;i++)
        {
            var productindex = productswithwarehouse.indexOf(products[i]);
            if(availibilityofproducts[productindex] == "Shipped")
            {
                throw new Error("Product has already been shipped");
            }
            initiatingwarehouse.availibility[productindex] = "Shipped";
        }
        var shippers = initiatingwarehouse.shipperfromwarehouse;
        for (var i=0;i<shippers.length;i++)
        {
            if(shippers[i].getIdentifier() == shipper.getIdentifier())
            {
                index =i;
                break;
            }
        }
        if(typeof index == 'undefined')
        {
            throw new Error("Shipper is not a valid shipper of the particular warehouse");
        }
        sid = initiatingwarehouse.shipmentnumber[index];
        if(typeof sid == 'undefined')
        {
            throw new Error("Shipper is not a valid shipper of the particular warehouse");
        }
        initiatingwarehouse.shipmentnumber[index]= initiatingwarehouse.shipmentnumber[index]+1;
        warehouseparticipantregistry.update(initiatingwarehouse);
        return getAssetRegistry('org.supplychain.Shipment_from_warehouse')
    })
    .then(function(shipmentassetregistry){
        ssid=sid.toString();
        ssid=ssid+initiatingwarehouse.getIdentifier()+retailer.getIdentifier();
        var shipment = factory.newResource(NS,'Shipment_from_warehouse',ssid);
        shipment.shipment_ID=ssid;
        shipment.pickup=pickup;
        shipment.products=products;
        shipment.initiatingwarehouse = initiatingwarehouse;
        shipment.retailer=retailer;
        shipment.shipperfromwarehouse=shipper;
        return shipmentassetregistry.add(shipment);
    })
    .then(function(){
        console.log("Shipment added");
        return getAssetRegistry('org.supplychain.Product')
    })
    .then(function(productassetregistry){
        for(var i=0;i<products.length;i++)
        {
            if(typeof products[i].shipmentfromwarehouse == 'undefined')
            {
                products[i].shipmentfromwarehouse = new Array();
                products[i].shipmentfromwarehouse[0] = factory.newRelationship(NS,'Shipment_from_warehouse',ssid);
            }
            else{
                var ship = factory.newRelationship(NS,'Shipment_from_warehouse',ssid);
                products[i].shipmentfromwarehouse.push(ship);
            }
        }
        productassetregistry.updateAll(products);
    })
    .catch(function(error){
        console.log(error);
    })
 }


 /**
  * Transaction to enter delivered date for a shipment from the warehouse
  * @param {org.supplychain.delveryconfirmedbywarehouseshipper} tx
  * @transaction
  */

 async function deliveryconfirmedbywarehouseshipper(tx){ 
    const factory = getFactory();
    const NS = 'org.supplychain';

    var shipmentfromwarehouse = tx.shipmentfromwarehouse;
   

    var receivingwarehouse = shipmentfromwarehouse.receivingwarehouse;
    var retailer = shipmentfromwarehouse.retailer;
    var flag;
    var productsreceived = shipmentfromwarehouse.products;
    let currentParticipant = getCurrentParticipant();
    var shipper = shipmentfromwarehouse.shipperfromwarehouse;

    if(typeof retailer === 'undefined'){
         flag=0;           
    }
    else if (typeof receivingwarehouse === 'undefined')
    {      
         flag=1;
    }

    //JS promises
    if(flag==0){
         return getAssetRegistry('org.supplychain.Shipment_from_warehouse')
         .then(function(shipmentassetregistry){
            if(shipper.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
            {
                throw new Error("Not authorised to to mark this shipment as delivered");
            }
            if(typeof shipmentfromwarehouse.delivered_date != 'undefined')
            {
                throw new Error("Delivery already confirmed");
            }
            shipmentfromwarehouse.delivered_date = tx.timestamp;
             return shipmentassetregistry.update(shipmentfromwarehouse)
         })
         .then(function(){
             console.log("Date added");
             return getAssetRegistry('org.supplychain.Product')
         })
         .then(function(productassetregistry){
             for(var i=0;i<productsreceived.length;i++)
             {
                 var war = factory.newRelationship(NS,'Warehouse',receivingwarehouse.getIdentifier());
                 productsreceived[i].warehouses.push(war);
             }
            return productassetregistry.updateAll(productsreceived);
         })
         .then(function(){
            console.log("Warehouse details added to product");
            return getParticipantRegistry('org.supplychain.Warehouse')
         })
         .then(function(warehouseparticipantregistry){
           if(typeof receivingwarehouse.products == 'undefined')
            {
                receivingwarehouse.products = new Array();
                receivingwarehouse.availibility = new Array();
                var prod; 
                prod = factory.newRelationship(NS,'Product',productsreceived[0].getIdentifier());
                receivingwarehouse.products[0]=prod;
                receivingwarehouse.availibility[0] = "Available";
                for(var i=1;i<productsreceived.length;i++)
                {
                    prod = factory.newRelationship(NS,'Product',productsreceived[i].getIdentifier());
                    receivingwarehouse.products.push(prod);
                    receivingwarehouse.availibility.push("Available");
                }
            }
            else{
                for(var i=0;i<productsreceived.length;i++)
                {
                    var prod = factory.newRelationship(NS,'Product',productsreceived[i].getIdentifier());
                    receivingwarehouse.products.push(prod);
                    receivingwarehouse.availibility.push("Available");
                }
            }
            warehouseparticipantregistry.update(receivingwarehouse)            
         })
         .catch(function(error){
             console.log(error);
         })
    }
    else if(flag==1){ 
     return getAssetRegistry('org.supplychain.Shipment_from_warehouse')
     .then(function(shipmentassetregistry){
        if(shipper.getFullyQualifiedIdentifier() !== currentParticipant.getFullyQualifiedIdentifier())
        {
            throw new Error("Not authorised to to mark this shipment as delivered");
        }
        if(typeof shipmentfromwarehouse.delivered_date != 'undefined')
        {
            throw new Error("Delivery already confirmed");
        }
        shipmentfromwarehouse.delivered_date = tx.timestamp;
         return shipmentassetregistry.update(shipmentfromwarehouse)
     })
     .then(function(){
         console.log("Date added");
         return getParticipantRegistry('org.supplychain.Retailer')
     })
     .then(function(retailerparticipantregistry){
         if(typeof retailer.products == 'undefined')
         {
            retailer.products = new Array();
            retailer.retailavailibility = new Array();
             var product = factory.newRelationship(NS,'Product',productsreceived[0].getIdentifier());
             retailer.products[0] = product;
             retailer.retailavailibility[0] ="Available";
             for(var i=1;i<productsreceived.length;i++)
             {
                 var product = factory.newRelationship(NS,'Product',productsreceived[i].getIdentifier());
                 retailer.products.push(product);
                 retailer.retailavailibility.push("Available");
             }
         }
         else{
             for(var i=0;i<productsreceived.length;i++)
             {
                 var product = factory.newRelationship(NS,'Product',productsreceived[i].getIdentifier());
                 retailer.products.push(product);
                 retailer.retailavailibility.push("Available");
             }
         }

         return retailerparticipantregistry.update(retailer)
     })
     .then(function(){
         console.log("Retailer updated");
         return getAssetRegistry('org.supplychain.Product')
     })
     .then(function(productassetregistry){
        for(var i=0;i<productsreceived.length;i++)
        {
            productsreceived[i].retailer = factory.newRelationship(NS,'Retailer',retailer.getIdentifier());
        }
        productassetregistry.updateAll(productsreceived);
    })
     .catch(function(error){
         console.log(error);
     })
 }
}

/**
 * Transaction to make a product ready for inspection
 * @param {org.supplychain.getreadyforinspection} tx
 * @transaction
 */

 async function readyforinspection(tx){ //permission yet to be made
     const factory =getFactory();
     const NS = 'org.supplychain';
    var flag=0;
     var product = tx.product;
     let currentparticipant = getCurrentParticipant();
     if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.Processor')
     {
         throw new Error('Not authorised!!');
     }
     var processor = currentparticipant;
     for(var i=0;i<processor.products.length;i++)
     {
         if(product.getIdentifier() == processor.products[i].getIdentifier() && processor.availibility[i] == "Available")
         {
            flag =1;
            break;
         }
     }
     if(flag ==0 )
     {
         throw new Error("Product not with processor");
     }

     var type = currentparticipant.type;
     var authorisedtype;
     return getAssetRegistry('org.supplychain.config')
     .then(function(configassetregistry){
         return configassetregistry.get('1')
     })
     .then(function(specificconfig){
        var types = specificconfig.type;
        var participants = specificconfig.participants;
        var index = participants.lastIndexOf('Processor');
        authorisedtype = types[index];
        return getAssetRegistry('org.supplychain.Product')
     })
     .then(function(productassetregistry){
        if(type != authorisedtype)
        {
            throw new Error("Not the authorised type of processor");
        }
        product.qualitycheck = "Ready";
        productassetregistry.update(product);
     })
     .catch(function(error){
         console.log(error);
     });
 }

/**
 * Transaction to inspect the quality of a product
 * @param {org.supplychain.qualityinspection} tx
 * @transaction
 */

 async function qualitycheck(tx) {
     const factory = getFactory();
     const NS = 'org.supplychain'

     var product=tx.product;
     var result=tx.result;
     var lastprocessortype;
     var firstwarehousetype;

    let currentParticipant = getCurrentParticipant();
    if(currentParticipant.getFullyQualifiedIdentifier() !== 'org.supplychain.QI#7734'){
        throw new Error("Not authorised!!");
    }
    if(product.qualitycheck != "Ready")
    {
        throw new Error("Not ready for inspection");
    }

     //JS Promises

     return getAssetRegistry('org.supplychain.config')
     .then(function(configassetregistry){
         return configassetregistry.get('1')
     })
     .then(function(specificconfig){
        var types = specificconfig.type;
        var participants = specificconfig.participants;
        var firstwarehouseindex = participants.indexOf('Warehouse');
        var lastprocssorindex = participants.lastIndexOf('Processor');
        lastprocessortype = types[lastprocssorindex];
        firstwarehousetype = types[firstwarehouseindex];
    
        return getAssetRegistry('org.supplychain.Product')
     })
     .then(function(productassetregistry){
        var processors = product.processors;
        var processorslen = processors.length;
        var indextocheck = processorslen-1;
        var processor = processors[indextocheck];
        if (processor.type != lastprocessortype || typeof product.warehouses != 'undefined')
        {
            throw new Error("Quality inspection cannot be done at this stage.")
        }
        product.qualitycheck=result;
        return productassetregistry.update(product);
     })
     .then(function(){
        console.log("Quality check done");
     })
     .catch(function(error){
         console.log(error);
     })
 }

 /**
  * Transaction to trace the product to its roots
  * @param {org.supplychain.traceproduct} tx
  * @transaction
  */

  async function traceproduct(tx){
      
    const factory=getFactory();
    const NS='org.supplychain';

    var product = tx.product;
    var warehouses = product.warehouses;
    var items = product.items;
    var shipmentfromproducertoprocessor = new Array();
    var qualityinspector = product.qualityinspector;
    var status =  product.approved;
    var processors = product.processors;
    var retailer = product.retailer;
    var shipmentsfromprocessor = product.shipmentfromprocessor;
    var shipmentsfromwarehouse = product.shipmentfromwarehouse;
    var shippersfromprocessor = new Array();
    var shippersfromwarehouse = new Array();
    var shipperfromproducers = new Array();
    var producers = new Array();
    for(var i =0 ;i<items.length;i++)
    {
        producers.push(items[i].producer);
        shipmentfromproducertoprocessor.push(items[i].shipment_from_producer_to_processor);
    }
    for (var i=0;i<shipmentsfromprocessor.length;i++)
    {
        shippersfromprocessor.push(shipmentsfromprocessor[i].shipperfromprocessor);
    }
    for (var i=0;i<shipmentsfromwarehouse.length;i++)
    {
        shippersfromwarehouse.push(shipmentsfromwarehouse[i].shipperfromwarehouse);
    }
    for (var i=0;i<shipmentfromproducertoprocessor.length;i++)
    {
        shipperfromproducers.push(shipmentfromproducertoprocessor[i].shipperfromproducertoprocessor);
    }
    console.log(producers);
    console.log(shipperfromproducers);
    console.log(processors);
    console.log(shippersfromprocessor);
    console.log(warehouses);
    console.log(shippersfromwarehouse);
    console.log(retailer);
  }

/**
 * Transaction to run query
 * @param {org.supplychain.runquery} tx
 * @transaction
 */

async function runquery(tx){ /////////needs to change

    let currentparticipant = getCurrentParticipant();
    var type = currentparticipant.type;
    return getAssetRegistry('org.supplychain.config')
    .then(function(configassetregistry){
      return configassetregistry.get('1')
    })
    .then(function(specificconfig){
        var types = specificconfig.type;
        var indexoftype = types.indexOf(type);
        var res = indexoftype+1;
        var typetosearch = types[res];
        return query('Q1',{ participanttypewanted: typetosearch})
    })
    .then(function (participants) {
      participants.forEach(function (participant) {
          console.log(participant.name);
      });
    })
  }

/**
 * Transaction to view all the shippers of a producer
 * @param {org.supplychain.queryviewshippersofproducer} tx
 * @transaction
 */

   async function shippersofproducers(tx){
       
    let currentparticipant = getCurrentParticipant();
    if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.Producer')   
        throw new Error("Only producers can access this transaction");
    var gst = currentparticipant.GST_number;
    return query('Q2',{ gstnum: gst })
    .then(function(prod){
        
        console.log(prod[0].shipperfromproducertoprocessor);
    })
    .catch(function(error){
        console.log(error);
    });
   }

/**
 * Transaction to view all the shippers of a processor
 * @param {org.supplychain.queryviewshippersofprocessor} tx
 * @transaction
 */

  async function shippersofprocessors(tx){
       
    let currentparticipant = getCurrentParticipant();
    if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.Processor')   
        throw new Error("Only processors can access this transaction");
    return query('Q3',{ gstnum: currentparticipant.GST_number })
    .then(function(proc){
        console.log(proc[0].shipperfromprocessor);        
    })
    .catch(function(error){
        console.log(error);
    });
   }

/**
 * Transaction to view all the shippers of a warehouse
 * @param {org.supplychain.queryviewshippersofwarehouses} tx
 * @transaction
 */

async function shippersofwarehouses(tx){
       
    let currentparticipant = getCurrentParticipant();
    if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.Warehouse')   
        throw new Error("Only warehouses can access this transaction");
    return query('Q4',{ gstnum: currentparticipant.GST_number })
    .then(function(war){
        console.log(war[0].shipperfromwarehouse);        
    })
    .catch(function(error){
        console.log(error);
    });
   }

/**
 * Transaction to view the items available with a producer
 * @param {org.supplychain.queryviewitemsunusedwithprocessor} tx
 * @transaction
 */

 async function itemswithprocessor(tx){  //left
    let currentparticipant = getCurrentParticipant();
    if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.Processor')   
        throw new Error("Only processors can access this transaction");
    return query('Q6',{ gstnum: currentparticipant.GST_number})
    .then(function(processors){
        var items = processors[0].items;
        var itemavailibility = processors[0].itemavailibility;
        var unuseditems = new Array();

        for(var i=0;i<items.length;i++)
        {
            if(itemavailibility[i] == "Unused")
            {
                unuseditems.push(items[i]);
            }
        }
        console.log(unuseditems);
    })
    .catch(function(error){
        console.log(error);
    });
 }

/**
 * Transaction to view the available items with a producer
 * @param {org.supplychain.queryviewitemswiththeproducer} tx
 * @transaction
 */

 async function itemsavailablewithproducer(tx){
    let currentparticipant = getCurrentParticipant();
    if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.Shipper_from_producer_to_processor')   
        throw new Error("Only shippers can access this transaction");
    var cp = currentparticipant.toURI();
    return query('Q7', { shipper: cp })
    .then(function(producers){
        var itemswithproducer = producers[0].items;
        console.log(itemswithproducer);
        var availibility = producers[0].availibility;
        var availableitems = new Array();

        for(var i=0;i<itemswithproducer.length;i++){
            if(availibility[i] == "Available"){
                availableitems.push(itemswithproducer[i]);
            }
        }
        console.log(availableitems);
    })
    .catch(function(error){
        console.log(error);
    });
 }

/**
 * Transaction to view the available items with a producer
 * @param {org.supplychain.queryviewproductswithprocessor} tx
 * @transaction
 */

  async function productsavailablewithprocessor(tx){
    let currentparticipant = getCurrentParticipant();
    if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.Shipper_from_processor')   
        throw new Error("Only shippers can access this transaction");
    var cp = currentparticipant.toURI();
    return query('Q8',{ shipper: cp })
    .then(function(processors){
        var products = processors[0].products;
        var availibility = processors[0].availibility;
        var availableproducts = new Array();

        for(var i=0;i<products.length;i++){
            if(availibility[i] == "Available"){
                availableproducts.push(products[i]);
            }
        }
        console.log(availableproducts);
    })
    .catch(function(error){
        console.log(error);
    });
  }

/**
 * Transaction to view the available items with a producer
 * @param {org.supplychain.queryviewproductswithwarehouse} tx
 * @transaction
 */
 
   async function productsavailablewithwarehouse(tx){
     let currentparticipant = getCurrentParticipant();
     if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.Shipper_from_warehouse')   
         throw new Error("Only shippers can access this transaction");
     var cp = currentparticipant.toURI();
     return query('Q9',{ shipper: cp })
     .then(function(warehouses){
         var products = warehouses[0].products;
         var availibility = warehouses[0].availibility;
         var availableproducts = new Array();
 
         for(var i=0;i<products.length;i++){
             if(availibility[i] == "Available"){
                 availableproducts.push(products[i]);
             }
         }
         console.log(availableproducts);
     })
     .catch(function(error){
         console.log(error);
     });
   }

/**
 * Transaction to view all the shipments by a shipper
 * @param {org.supplychain.queryviewshipmentsfromproducer} tx
 * @transaction
 */

 async function shipmentstobedeliveredfromproducer(tx){
    let currentparticipant = getCurrentParticipant();
    if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.Shipper_from_producer_to_processor')   
        throw new Error("Only authorised shippers can access this transaction");
    var cp = currentparticipant.toURI();
    return query('Q10',{ shipper: cp })
    .then(function(shipments){
        var shipmentsyetodeliver = new Array();

        for(var i=0;i<shipments.length;i++)
        {
            if(typeof shipments[i].delivered_date == 'undefined'){
                shipmentsyetodeliver.push(shipments[i]);
            }
        }
        console.log(shipmentsyetodeliver);
    })
    .catch(function(error){
        console.log(error);
    });
 }

/**
 * Transaction to view all the shipments by a shipper
 * @param {org.supplychain.queryviewshipmentsfromprocessor} tx
 * @transaction
 */

async function shipmentstobedeliveredfromprocessor(tx){
    let currentparticipant = getCurrentParticipant();
    if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.Shipper_from_processor')   
        throw new Error("Only authorised shippers can access this transaction");
    var cp = currentparticipant.toURI();
    return query('Q11',{shipper: cp})
    .then(function(shipments){
        var shipmentsyetodeliver = new Array();

        for(var i=0;i<shipments.length;i++)
        {
            if(typeof shipments[i].delivered_date == 'undefined'){
                shipmentsyetodeliver.push(shipments[i]);
            }
        }
        console.log(shipmentsyetodeliver);
    })
    .catch(function(error){
        console.log(error);
    });
 }

/**
 * Transaction to view all the shipments by a shipper
 * @param {org.supplychain.queryviewshipmentsfromwarehouse} tx
 * @transaction
 */

 async function shipmentstobedeliveredfromwarehouse(tx){
    let currentparticipant = getCurrentParticipant();
    if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.Shipper_from_warehouse')   
        throw new Error("Only authorised shippers can access this transaction");
    var cp=currentparticipant.toURI();
    return query('Q12',{shipper: cp})
    .then(function(shipments){
        var shipmentsyetodeliver = new Array();

        for(var i=0;i<shipments.length;i++)
        {
            if(typeof shipments[i].delivered_date == 'undefined'){
                shipmentsyetodeliver.push(shipments[i]);
            }
        }
        console.log(shipmentsyetodeliver);
    })
    .catch(function(error){
        console.log(error);
    });
 }

 /**
  * Transaction to view all the products ready for inspection
  * @param {org.supplychain.queryviewproductstoinspect} tx
  * @transaction
  */

  async function productsreadytoinspect(tx){
      let currentparticipant = getCurrentParticipant();
      if(currentparticipant.getFullyQualifiedType() != 'org.supplychain.QI')
        throw new Error("Only quality inspectors can access this transaction")
      return query('Q5', {})
      .then(function(products){
          console.log(products);
      })
      .catch(function(error){
          console.log(error);
      });
  }