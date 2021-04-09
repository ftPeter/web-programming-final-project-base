
const express = require('express');
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");
const path = require('path');
const router = express.Router();
const PORT = process.env.PORT || 5000
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// secret used to encode/decode JWTs
const secret = "supersecret";
let customer = "";

express()
  .use(express.static(path.join(__dirname, 'public'), {
    index: false
  }))
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use("/api", router)
  .get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/authentication/login.html'));
  })
  // ENDPOINT for user logout
  .get('/api/status', (req, res) => {
    if (!req.headers["x-auth"]) {
      res.sendStatus(401).json({ error: "Missing X-Auth header" });
    }
    const token = req.headers["x-auth"];
    try {
      const decoded = jwt.decode(token, secret);
      if (decoded.username === customer) {
        res.sendStatus(200);
      }
    } catch (exception) {
      console.trace(exception);
      res.sendStatus(500);
    }
  })
  // ENDPOINT for user authentication in login page
  .post("/api/auth", (req, res) => {
    customer = req.body.username;
    const username = customer;
    const hash = bcrypt.hashSync(req.body.password, 10);

    const payload = {
      username: username,
      password: hash
    }
    // Create a token for the customer
    const token = jwt.encode(payload, secret);
    // Get an authentication object from the database
    authentication = authenticate(username, hash);
    if (authentication.authorized) {
      res.json({token: token, customer_id: authentication.ID});
    } else {
      // Unauthorized access
      res.sendStatus(401);
    }
  })
  // ENDPOINT for retrieving a user's order from /api/orders to display on confirmation page
  .get('/api/orders', (req, res) => {
    const customer_id = (req.query.customer_id) ? req.query.customer_id : "";
    const price = (req.query.price) ? req.query.price : "$0.00";
    const entrees = (req.query.entrees) ? req.query.entrees : [];
    const sides = (req.query.entrees) ? req.query.entrees : [];
      
    let menu_info = {
      customerId: customer_id,
      price: price,
      entrees: entrees,
      sides: sides
    }

    if (validateMenu(entrees, sides, price)) {
      res.sendStatus(204).json(), menu_info;
    } else {
      res.render('pages/menu', menu_info);
    }

  })
  // ENDPOINT for posting a user's order from the menu page to /api/orders
  .post('/api/orders', (req, res) => {
    const customer_id = req.body.customer_id;
    const entrees = req.body.entrees;
    const sides = req.body.sides;
    const price = req.body.price;

    if (validateMenu(entrees, sides)) {
      res.redirect('/confirmation/confirmation.html');
    } else {
      res.sendStatus(400);
    }

  })
  // ENDPOINT for posting the confirmation info to DB on order confirmation page
  .post('/api/confirm', async (req, res) => {
      const customer_id = req.body.customerid;
      const order = req.body.order;

      let confirm_info = {customerid: customer_id, order: order};
        
      if (validateConfirm(order)) {
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

              const order_status = results.order_status;
              const customer_id = results.customer_id;
              const order = results.food_order;

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
  // ENDPOINT for customer facing status page using api/status
  .get('/api/status', async (req, res) => {
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
        const order_status = results.order_status;
        const customer_id = results.customer_id;
        const order = results.food_order;

        let customer_info = {customerID:customer_id, order: order, ordernumber: order_number,
          orderstatus: order_status};

        res.render('pages/customerstatus', customer_info);
        client.release();
      } catch (err) {
        console.error(err);
        res.send("Error " + err);
      }
  })
  // ENDPOINT for getting the service status of the customer order
  .get('/api/service', async (req, res) => {
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
  // ENDPOINT for posting the status of the customer's order to api/service
  .post('/api/service', async (req, res) => {
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
        new_status = 'Ready';
      else 
        new_status = 'Picked Up';

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


/* * * * * * * * * * * * * * * * * * * * * *  
 *          SERVER-SIDE FUNCTIONS          *
 * * * * * * * * * * * * * * * * * * * * * *  
*/

// validate that the user is using correct login, and if they don't exist in DB, we create a new user
function authenticate(username, password) {
  // TODO: set up user authentication
  authentication = {
    authorized: true,
    ID: 1
  }
  return authentication;
}

// add a new user to the database
function addUser(username, password) {

}

// server side validation for the menu page submissions
function validateMenu(entrees, sides, price) {
  return (entrees.length != 0 || sides.length != 0 && price != "$0.00");
}

// server side validaiton for the confirm page submissions
function validateConfirm(order) {
  return (order.length != 0);
}