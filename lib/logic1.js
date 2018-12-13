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
 * @param {org.supplychain1.initiate} tx
 * @transaction
 */

 async function initiate(tx) {
     const factory = getFactory();
     const NS = "org.supplychain1";

     //JS promises
     return getAssetRegistry('org.supplychain1.config')
     .then(function(assetregistry){
        return assetregistry.getAll();
     })
     .then(function(configs){
        if(configs.length > 0)
            throw new Error("Already initiated");
        else
            return getAssetRegistry('org.supplychain1.config')
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
  * @param {org.supplychain1.createItem} tx
  * @transaction
  */

  async function createitem(tx){
    const factory = getFactory();
    const NS = "org.supplychain1";

    let currentParticipant = getCurrentParticipant();

    //JS promises
    return getAssetRegistry('org.supplychain1.Item')
    .then(function(assetregistry){
        var item = factory.newResource(NS,'Item',tx.item_ID);
        item.item_ID = tx.item_ID;
        item.name = tx.name;
        item.date = tx.timestamp;
        if(tx.producer.getIdentifier() !== currentParticipant.getFullyQualifiedIdentifier().slice(-4))
        {
            console.log(tx.producer);
            console.log(currentParticipant.getFullyQualifiedIdentifier().slice(-4));
            throw new Error("Not authorised!!");
        }
        item.producer = tx.producer;
        assetregistry.add(item);
    })
    .catch(function(error){
        console.log(error);
    });
}

/**
 * Transaction to create a shipper from producer to processor
 * @param {org.supplychain1.createshipperfromproducertoprocessor} tx
 * @transaction
 */

 async function createshipper(tx){
    const factory = getFactory();
    const NS = "org.supplychain1";

    let currentParticipant = getCurrentParticipant();

    var shipper = factory.newResource(NS,'Shipper_from_producer_to_processor',tx.GST_number);
    shipper.GST_number=tx.GST_number;
    shipper.name=tx.name;
    shipper.email=tx.email;
    shipper.location=tx.location;
    if(tx.producer.getIdentifier() !== currentParticipant.getFullyQualifiedIdentifier().slice(-4))
    {
        console.log(tx.producer);
        console.log(currentParticipant.getFullyQualifiedIdentifier().slice(-4));
        throw new Error("Not authorised!!");
    }
    shipper.producer = tx.producer;
    var prod= shipper.producer;
    console.log(prod)

    //JS promises
    return getParticipantRegistry('org.supplychain1.Shipper_from_producer_to_processor')
    .then(function(participantregistry){   
        participantregistry.add(shipper);
        return getParticipantRegistry('org.supplychain1.Producer')
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
  * @param {org.supplychain1.createshipmentfromproducertoprocessor} tx
  * @transaction
  */

async function shipmentfromproducertoprocessor(tx){

    //check if the producer exists then 
    //check if the items belong to his inventory
    //check if the processor is the next in the participant array of config asset
    //get shipping id
    //add shipment
    //increment number of shipments in the producer participant 
    //add shipment number in item assest

    //check if the shipper invoking the transaction is present in the processor's array of shipper
    //(sid will be undefined if isn't present) then throw error ------left

    const factory = getFactory();
    const NS = 'org.supplychain1';

    let currentParticipant = getCurrentParticipant();
    
    var items = tx.items;
    var producer = tx.producer; 
    var processor = tx.processor;
    var typetoconfirm = processor.type;
    var shipper = tx.shipperfromproducertoprocessor;
    var index,sid,ssid;
    var flag=0;
    

    //JS promises
    return getParticipantRegistry('org.supplychain1.Producer')
    .then(function(participantregistry){
        return participantregistry.exists(producer.getIdentifier());
    })
    .then(function(exists){
        console.log("Producer exists",exists);
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
                throw new Error(items[i].name,"not in the producer inventory");
            }
        }
        return getAssetRegistry('org.supplychain1.config')
    })
    .then(function(configassetregistry){
        return configassetregistry.get('1')
    })
    .then(function(config){
        var typetocheck = config.type;
        if(typetocheck[1] !== typetoconfirm)
            throw new Error("This is not the next participant in chain");
        return getParticipantRegistry('org.supplychain1.Producer')
    })
    .then(function(producerparticipantregistry){
        
        var shippers= producer.shipperfromproducertoprocessor;
        for(var i=0;i<shippers.length;i++)
        {
          if(shippers[i].getIdentifier()==shipper.getIdentifier())
          {
            index=i;
            break;
          }
        }
        sid = producer.shipmentnumber[index];
        producer.shipmentnumber[index] = producer.shipmentnumber[index]+1;
        producerparticipantregistry.update(producer);
        return getAssetRegistry('org.supplychain1.Shipment_from_producer_to_processor')
    })
    .then(function(shipmentassetregistry){
        ssid=sid.toString();
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
        return getAssetRegistry('org.supplychain1.Item')
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
 * @param {org.supplychain1.delveryconfirmedbyproducertoprocessorshipper} tx
 * @transaction
 */

 async function delveryconfirmed(tx){
    const factory = getFactory();
    const NS = 'org.supplychain1';

    //enter delivered date for the entered shipment
    //update the items in the processors inventory

    var shipment = tx.shipmentfromproducertoprocessor;
    shipment.delivered_date = tx.timestamp;
    var processor = shipment.processor;
    var shipmentitems = shipment.items;
    var item;

    //JS promises
    return getAssetRegistry('org.supplychain1.Shipment_from_producer_to_processor')
    .then(function(shipmentregistry){
        shipmentregistry.update(shipment);
        return getParticipantRegistry('org.supplychain1.Processor')
    })
    .then(function(processorregistry){
        if (typeof processor.items == 'undefined') {
            processor.items = new Array();
            processor.items[0] = factory.newRelationship(NS,'Item',shipmentitems[0].getIdentifier());
            for(var i=1;i<shipmentitems.length;i++){
                item = factory.newRelationship(NS,'Item',shipmentitems[i].getIdentifier());
                processor.items.push(item);
            }
        } 
        else {
            for(var i=0;i<items.length;i++){
                item = factory.newRelationship(NS,'Item',shipmentitems[i].getIdentifier());
                processor.items.push(item);           }
        }
        processorregistry.update(processor);
    })
    .catch(function(error){
        console.log(error);
    });
 }

 /**
  * Transaction to create a product
  * @param {org.supplychain1.createproduct} tx
  * @transaction
  */
 
  async function productcreation(tx){ 
    const factory = getFactory();
    const NS ='org.supplychain1';

    var useditems = tx.items;
    var processor = tx.processor;
    var pid = tx.product_ID;
    var flag;
    var itemswithprocessor = processor.items;
    //add QI
    //check if the items entered are in the inventory of the particular processor
    
    var qualityinspector = factory.newResource(NS,'QI','7334');
    
    for(var i =0;i<useditems.length;i++)
    {
        flag=0;
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
    }    

    //JS promises
    return getAssetRegistry('org.supplychain1.Product')
    .then(function(productregistry){
        var product = factory.newResource(NS,'Product',pid);
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
        productregistry.add(product);

    })
    .catch(function(error){
        console.log(error);
    });
  }

  /**
   * Transaction to create shipper from processor
   * @param {org.supplychain1.createshipperfromprocessor} tx
   * @transaction
   */

   async function shipperfromprocessor(tx){
    const factory = getFactory();
    const NS ='org.supplychain1';

    let currentParticipant = getCurrentParticipant();

    var shipper = factory.newResource(NS,'Shipper_from_processor',tx.GST_number);
    shipper.GST_number=tx.GST_number;
    shipper.name=tx.name;
    shipper.email=tx.email;
    shipper.location=tx.location;
    if(tx.processor.getIdentifier() !== currentParticipant.getFullyQualifiedIdentifier().slice(-4))
    {
        console.log(tx.processor);
        console.log(currentParticipant.getFullyQualifiedIdentifier().slice(-4));
        throw new Error("Not authorised!!");
    }
    shipper.initiatingprocessor = tx.processor;
    var proc= shipper.initiatingprocessor;

    //JS promises
    return getParticipantRegistry('org.supplychain1.Shipper_from_processor')
    .then(function(participantregistry){   
        participantregistry.add(shipper);
        return getParticipantRegistry('org.supplychain1.Processor')
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
  * @param {org.supplychain1.createshipmentfromprocessortowarehouse} tx
  * @transaction
  */

  async function shipmentfromprocessortowarehouse(tx){  //need to test
    const factory= getFactory();
    const NS = 'org.supplychain1';

    var shippingproducts=tx.products;
    var warehouse = tx.warehouse;
    var processor = tx.initiatingprocessor;

    var pickup = tx.timestamp;
    var shipper = tx.shipperfromprocessor;
    var index,sid,ssid;
    var flag=0;
    let currentParticipant = getCurrentParticipant();

    //if(shipper.getIdentifier() !== currentParticipant.getFullyQualifiedIdentifier().slice(-4))
    //{
    //    throw new Error("Not Authorised!!!");
    //}


    //check if the warehouse exists then 
    //check if the products belong to processor's inventory
    //check if the warehouse is the next in the participant array of config asset
    //get shipping id
    //increment number of shipments in the processor participant 
    //add shipment
    //add shipment number in product assest

    //check if the shipper invoking the transaction is present in the processor's array of shipper
    //(sid will be undefined if isn't present) then throw error ------left

    //JS promises

    return getParticipantRegistry('org.supplychain1.Warehouse')
    .then(function(warehouseparticipantregistry){
        return warehouseparticipantregistry.exists(warehouse.getIdentifier())
    })
    .then(function(exists){
        console.log("Warehouse exisits",exists);
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
                console.log("The product is not in the inventory of the processor");
            }
        }
        return getAssetRegistry('org.supplychain1.config')
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
        if(warehousetype !== types[resultindex] && participants[resultindex] != 'Warehouse'){
            console.log('Not the authorised next participant');
        } 

        return getParticipantRegistry('org.supplychain1.Processor')
    })
    .then(function(processorregistry){
        var shippers = processor.shipperfromprocessor;
        for (var i=0;i<shippers.length;i++)
        {
            if(shippers[i].getIdentifier() == shipper.getIdentifier())
            {
                index =i;
                break;
            }
        }
        sid = processor.shipmentnumber[index];
        processor.shipmentnumber[index]= processor.shipmentnumber[index]+1;
        processorregistry.update(processor);
        return getAssetRegistry('org.supplychain1.Shipment_from_processor')
    })
    .then(function(shipmentassetregistry){
        ssid=sid.toString();
        var shipment = factory.newResource(NS,'Shipment_from_processor',ssid);
        shipment.shipment_ID=ssid;
        shipment.pickup=pickup;
        shipment.products=shippingproducts;
        shipment.initiatingprocessor = processor;
        shipment.warehouse=warehouse;
        shipment.shipperfromprocessor=shipper;

        shipmentassetregistry.add(shipment);
        return getAssetRegistry('org.supplychain1.Product')
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
   * @param {org.supplychain1.createshipmentfromprocessortoprocessor} tx
   * @transaction
   */

   async function shipmentfromprocessortoprocessor(tx) {
    const factory= getFactory();
    const NS = 'org.supplychain1';

    var shippingproducts=tx.products;
    var receivingprocessor = tx.receivingprocessor;
    var initiatingprocessor = tx.initiatingprocessor;

    var pickup = tx.timestamp;
    var shipper = tx.shipperfromprocessor;
    var index,sid,ssid;
    var flag=0;
    let currentParticipant = getCurrentParticipant();

    //if(shipper.getIdentifier() !== currentParticipant.getFullyQualifiedIdentifier().slice(-4))
    //{
    //    throw new Error("Not Authorised!!!");
    //}

    //check if the receiving processor exists then 
    //check if the products belong to processor's inventory
    //check if the processor is the next in the participant array of config asset
    //get shipping id
    //increment number of shipments in the processor participant 
    //add shipment
    //add shipment number in product assest

    //check if the shipper invoking the transaction is present in the processor's array of shipper
    //(sid will be undefined if isn't present) then throw error ------left
    //make sure that the shipper entered is right -------left

    //JS promises
    return getParticipantRegistry('org.supplychain1.Processor')
    .then(function(processorparticipantregistry){
        return processorparticipantregistry.exists(receivingprocessor.getIdentifier())
    })
    .then(function(exists){
        console.log("Processor exisits",exists);
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
        return getAssetRegistry('org.supplychain1.config')
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

        return getParticipantRegistry('org.supplychain1.Processor')
    })
    .then(function(processorregistry){
        var shippers = initiatingprocessor.shipperfromprocessor;
        for (var i=0;i<shippers.length;i++)
        {
            if(shippers[i].getIdentifier() == shipper.getIdentifier())
            {
                index =i;
                break;
            }
        }
        sid = initiatingprocessor.shipmentnumber[index];
        initiatingprocessor.shipmentnumber[index]= initiatingprocessor.shipmentnumber[index]+1;
        processorregistry.update(initiatingprocessor);
        return getAssetRegistry('org.supplychain1.Shipment_from_processor')
    })
    .then(function(shipmentassetregistry){
        ssid=sid.toString();
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
        return getAssetRegistry('org.supplychain1.Product')
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
   * @param {org.supplychain1.delveryconfirmedbyprocessorshipper} tx
   * @transaction
   */

   async function deliveryconfirmedbyprocessorshipper(tx){
       const factory = getFactory();
       const NS = 'org.supplychain1';

       var shipmentfromprocessor = tx.shipmentfromprocessor;
       shipmentfromprocessor.delivered_date = tx.timestamp;

       var receivingprocessor = shipmentfromprocessor.receivingprocessor;
       var warehouse = shipmentfromprocessor.warehouse;
       var flag;
       var productsreceived = shipmentfromprocessor.products;

       if(typeof warehouse === 'undefined'){
            flag=0;           
       }
       else if (typeof receivingprocessor === 'undefined')
       {      
            flag=1;
       }

       //JS promises
       if(flag==0){
            return getAssetRegistry('org.supplychain1.Shipment_from_processor')
            .then(function(shipmentassetregistry){
                return shipmentassetregistry.update(shipmentfromprocessor)
            })
            .then(function(){
                console.log("Date added");
                return getAssetRegistry('org.supplychain1.Product')
            })
            .then(function(productassetregistry){
                for(var i=0;i<productsreceived.length;i++)
                {
                    var proc = factory.newRelationship(NS,'Processor',receivingprocessor.getIdentifier());
                    productsreceived[i].processors.push(proc);
                }
                productassetregistry.updateAll(productsreceived);
            })
            .catch(function(error){
                console.log(error);
            })
       }
       else if(flag==1){ // to be tested
        return getAssetRegistry('org.supplychain1.Shipment_from_processor')
        .then(function(shipmentassetregistry){
            return shipmentassetregistry.update(shipmentfromprocessor)
        })
        .then(function(){
            console.log("Date added");
            return getParticipantRegistry('org.supplychain1.Warehouse')
        })
        .then(function(warehouseparticipantregistry){
            if(typeof warehouse.products == 'undefined')
            {
                warehouse.products = new Array();
                var product = factory.newRelationship(NS,'Product',productsreceived[0].getIdentifier());
                warehouse.products[0] = product;
                for(var i=1;i<productsreceived.length;i++)
                {
                    var product = factory.newRelationship(NS,'Product',productsreceived[i].getIdentifier());
                    warehouse.products.push(product);
                }
            }
            else{
                for(var i=0;i<productsreceived.length;i++)
                {
                    var product = factory.newRelationship(NS,'Product',productsreceived[i].getIdentifier());
                    warehouse.products.push(product);
                }
            }

            return warehouseparticipantregistry.update(warehouse)
        })
        .then(function(){
            console.log("Warehouse updated");
            return getAssetRegistry('org.supplychain1.Product')
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
        })
        .catch(function(error){
            console.log(error);
        })
    }
   }

   /**
    * Transaction to create shipper from warehouse
    * @param {org.supplychain1.createshipperfromwarehouse} tx
    * @transaction
    */

    async function createshipperforwarehouse(tx) {
        const factory = getFactory();
        const NS = 'org.supplychain1';

        var GST_number = tx.GST_number;
        var shipper = factory.newResource(NS,'Shipper_from_warehouse',GST_number);
        shipper.GST_number = GST_number;
        shipper.name=tx.name;
        shipper.email=tx.email;
        shipper.location=tx.location;
        let currentParticipant = getCurrentParticipant();

        if(tx.warehouse.getIdentifier() !== currentParticipant.getFullyQualifiedIdentifier().slice(-4))
        {
            throw new Error("Not authorised!!!");
        }
        
        shipper.initiatingwarehouse = tx.warehouse;
        var warehouse = tx.warehouse;

        //JS promises

        return getParticipantRegistry('org.supplychain1.Shipper_from_warehouse')
        .then(function(shipperparticipantregistry){
            return shipperparticipantregistry.add(shipper)
        })
        .then(function(){
            console.log("Shipper added");
            return getParticipantRegistry('org.supplychain1.Warehouse')
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
 * @param {org.supplychain1.createshipmentfromwarehousetowarehouse} tx
 * @transaction
 */

 async function shipmentfromwarehousetowarehouse(tx){  //need to test
    const factory = getFactory();
    const NS = 'org.supplychain1';

    var products = tx.products;
    var initiatingwarehouse=tx.initiatingwarehouse;
    var receivingwarehouse=tx.receivingwarehouse;
    var shipper=tx.shipperfromwarehouse;

    var index,sid,ssid;
    var flag=0;
    let currentParticipant = getCurrentParticipant();

    //if(shipper.getIdentifier() !== currentParticipant.getFullyQualifiedIdentifier().slice(-4))
    //{
    //    throw new Error("Not Authorised!!!");
    //}

    //check if the receiving warehouse exists then 
    //check if the products belong to initiating warehouse's inventory
    //check if the receiving warehouse is the next in the participant array of config asset
    //get shipping id
    //increment number of shipments in the initiating warehouse participant 
    //add shipment
    //add shipment number in product assest

    //check if the shipper invoking the transaction is present in the processor's array of shipper
    //(sid will be undefined if isn't present) then throw error ------left
    //make sure that the shipper entered is right -------left

    //JS promises 

    return getParticipantRegistry('org.supplychain1.Warehouse')
    .then(function(warehouseparticipantregistry){
        return warehouseparticipantregistry.exists(receivingwarehouse.getIdentifier());
    })
    .then(function(exists){
        console.log("Receiving warehouse exists",exists);
        for(var i=0;i<products.length;i++)
        {
            flag=0;
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
        return getAssetRegistry('org.supplychain1.config')
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

        return getParticipantRegistry('org.supplychain1.Warehouse')
    })
    .then(function(warehouseparticipantregistry){
        var shippers = initiatingwarehouse.shipperfromwarehouse;
        for (var i=0;i<shippers.length;i++)
        {
            if(shippers[i].getIdentifier() == shipper.getIdentifier())
            {
                index =i;
                break;
            }
        }
        sid = initiatingwarehouse.shipmentnumber[index];
        initiatingwarehouse.shipmentnumber[index]= initiatingwarehouse.shipmentnumber[index]+1;
        warehouseparticipantregistry.update(initiatingwarehouse);
        return getAssetRegistry('org.supplychain1.Shipment_from_warehouse')
    })
    .then(function(shipmentassetregistry){
        ssid=sid.toString();
        var shipment = factory.newResource(NS,'Shipment_from_warehouse',ssid);
        shipment.shipment_ID=ssid;
        shipment.pickup=pickup;
        shipment.products=products;
        shipment.initiatingwarehouse = initiatingwarehouse;
        shipment.receivingwarehouse=receivingwarehouse;
        shipment.shipperfromprocessor=shipper;
        return shipmentassetregistry.add(shipment);
    })
    .then(function(){
        console.log("Shipment added");
        return getAssetRegistry('org.supplychain1.Product')
    })
    .then(function(productassetregistry){
        for(var i=0;i<products.length;i++)
        {
            if(typeof products[i].shipmentfromwarehouse == 'undefined')
            {
                products[i].shipmentfromwarehouse = new Array();
                products[i].shipmentfromwarehouse[0] = factory.newRelationship(NS,'Shipment_from_processor',ssid);
            }
            else{
                var ship = factory.newRelationship(NS,'Shipment_from_processor',ssid);
                products[i].shipmentfromwarehouse.push(ship);
            }
        }
        productassetregistry.updateAll(products);
    })
    .catch(function(error){
        console.log(error);
    })
 }