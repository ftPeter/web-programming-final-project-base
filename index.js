
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(express.urlencoded({ extended: true }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/test', (req, res) => res.render('pages/test', { users: ["John", "Paul", "Ringo"] }))
  .get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/signin/sign_in.html'));
  })
  .post('/order', (req, res) => {
    const customer_id = "";
    const entrees = req.body.entrees
    const sides = req.body.sides
    const total = req.body.total
  })
  .get('/order', (req, res) => {
      // const first_name = (req.query.first) ? req.query.first : "";
      // const last_name = (req.query.last) ? req.query.last : "";
    const customer_id = (req.query.customer_id) ? req.query.customer_id : "";

    let entree = "";
    let sideList = "";
    let order = "";
    let price = "";
    
      if (req.query.entree) {
        entree = getEntrees(req.query.entrees);
        sideList = getSides(req.query.sides);
        order = getOrderText(entree, sideList);
        price = getTotal(req.query.total);
      }
      
      let menu_info = {customerId: customer_id,
                       order: order}

      if (validateMenu(customer_id, entree, sideList)) {
        let confirm_info = menu_info;

        res.render('pages/confirmation', confirm_info);
      } else {
        res.render('pages/menu', menu_info);
      }
  })
  .post('/confirm', async (req, res) => {
      const customer_id =  req.body.customerid;
      const order          = req.body.order;

      let confirm_info = {customerid: customer_id, order: order};
        
      if (validateConfirm(customerid, order)) {
          // Push the new information to the database
          // and get the result for the new order number
          //
          // example insert
          // INSERT INTO order_table (first_name, last_name, street_address, 
          //                          city_address, food_order, order_time, order_status)
          // VALUES ('Hope', 'Dog', '12 Street St', 'Northampton, MA', 
          //         'Fake order foods 4', now(), 'Received') 
          // RETURNING id;
          let query_text = "INSERT INTO order_table (customer_id, ";
          query_text += "food_order, order_time, order_status) ";
          query_text += "VALUES ('" + customer_id + "', '";
          query_text += order + "', now(), 'Received') RETURNING id;";

          try {
              const client = await pool.connect();

              // INSERT the new order information
              const result = await client.query(query_text);

              // get the new ID number returned from the INSERT query
              const order_number = (result) ? result.rows[0].id : null; 

              // with the new order number, get the appropriate customer info
              const select_result = await client.query('SELECT * FROM order_table WHERE id = ' + order_number);
              const results = (select_result) ? select_result.rows[0] : null;

              const order_status   = results.order_status;
              const customer_id     = results.customer_id;
              const order          = results.food_order;

              let customer_info = {customerID:customer_id, order: order, ordernumber: order_number,
                                   orderstatus: order_status};

              res.render('pages/customerstatus', customer_info);
              client.release();
           } catch (err) {
              console.error(err);
              res.send("Error " + err);
           }
      } else {
          res.render('pages/confirmation', confirm_info);
      }
  })
  // /status is the customer facing status page
  .get('/status', async (req, res) => {
      // replace first_name and everything from body with only the order number
      // the order number should be used to retrieve everything from the database.
      const order_number = req.query.ordernumber;
     
      // retrieve order info from database, determined by ordernumber
      //
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM order_table WHERE id = ' + order_number);
        const results = (result) ? result.rows[0] : null;
      
        // assemble the local variables for the order status
        const order_status   = results.order_status;
        const customer_id     = results.customer_id;
        const order          = results.food_order;

        let customer_info = {customerID:customer_id, order: order, ordernumber: order_number,
          orderstatus: order_status};

        res.render('pages/customerstatus', customer_info);
        client.release();
      } catch (err) {
        console.error(err);
        res.send("Error " + err);
      }
  })
  .get('/service', async (req, res) => {
    try {
      // query the db for all the orders
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM order_table');
      const results = (result) ? result.rows : null;

      // format the db results into orders for rendering
      let orders = [];
      for( let i=0; i<results.length; i++ ) {
          let o = results[i];
          orders.push({ timestamp: o.order_time,
                        order: o.food_order,
                        id: o.id,
                        customerID: o.customer_id,
                        orderstatus: o.order_status});
      }

      // render the page with the orders
      res.render('pages/servicestatus', {orders: orders}); 
      client.release();
    } catch (err) { 
        console.error(err); res.send("Error " + err);
    }
  })
  .post('/service', async (req, res) => {
    try {
      const order_number = req.body.id;

      // GET THE CURRENT ORDER_STATUS
      const client = await pool.connect();
      const old_status_result = await client.query('SELECT order_status FROM order_table WHERE id=' + order_number);
    
      old_status = old_status_result.rows[0].order_status;

      // EXAMPLE UPDATE
      // update order_table set order_status='Cooking' where id=1;
      // 
      // 'Received' -> 'Cooking'
      // 'Cooking' -> 'Out For Delivery'
      // 'Out For Delivery' -> 'Delivered'
      // 'Delivered' -> 'Delivered'
      let new_status = "";
      if (old_status === 'Received')
        new_status = 'Cooking';
      else if (old_status === 'Cooking')
        new_status = 'Out For Delivery';
      else 
        new_status = 'Delivered';

      // update the db with the new status
      await client.query("UPDATE order_table set order_status='" + new_status + "' where id=" + order_number);

      // query the db for all the orders
      const order_result = await client.query('SELECT * FROM order_table');
      const results = (order_result) ? order_result.rows : null;

      // format the db results into orders for rendering
      let orders = [];
      for( let i=0; i<results.length; i++ ) {
          let o = results[i];
          orders.push({  timestamp: o.order_time,
                        order: o.food_order,
                        id: o.id,
                        customerID: o.customer_id,
                        orderstatus: o.order_status});
      }

      // render the page with the orders
      res.render('pages/servicestatus', {orders: orders}); 
      client.release();
    } catch (err) { 
        console.error(err); res.send("Error " + err);
    }
  })

  // /db is a debugging view into the complete order_table database table
  .get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM order_table');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))


/*  HELPER FUNCTIONS BELOW 
 */

// server side validation for the menu page submissions
function validateMenu(entrees, Sides_and_Drinks) {
    let valid = false;

    if (entrees.length != 0 &&
      Sides_and_Drinks.length != 0) {
        valid = true;
    }

    return valid;
}

// server side validaiton for the confirm page submissions
function validateConfirm(order) {
    let valid = false;

    if (order.length != 0 ) {
        valid = true;
    }

    return valid;
}

// build a single string formatted order from the 
// entree and sides
// Implement this
function getOrderText(entree, sideList) {
    order = entree;

    sideList.forEach(function(r) {
        order += ", " + r;
    });
    return order;
}

// convert the item's buttons into strings
// for each of the side dishes

// Implement this
function getSides(body) {
    let sides = [];
    if (body.entree === "on")
        sides.push("Corn Bread")
    if (body.item1 === "on")
        sides.push("Creamed Corn")
    if (body.item2 === "on")
        sides.push("Green Beans")
    if (body.item3 === "on")
        sides.push("Mashed Potatos")
    if (body.item4 === "on")
        sides.push("Baked Beans")

    return sides;
}

// get the entrees from the customer order
function getEntrees(body) {
  let entrees = [];
}

// get the price total for the order
function getTotal(body) {
  let price = 0;
  let items;
}