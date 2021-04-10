
const express = require('express');
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");
const path = require('path');
const router = express.Router();
const PORT = process.env.PORT || 5000
const { Pool } = require('pg');
// environment variables
require('dotenv').config();
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
  .post("/api/auth", async (req, res) => {
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
    try {
      authentication = await authenticate(username, hash);
      if (authentication.authorized) {
          res.json({ token: token, customer_id: authentication.ID });
          return;
        } else {
          // Unauthorized access
          res.sendStatus(401);
          return;
        }
    } catch (error) {
      console.trace(error);
      res.sendStatus(500);
      return;
    }
  })
  // ENDPOINT for retrieving a user's order from /api/orders to display on confirmation page
  .get('/api/orders/:customer_id', (req, res) => {
    // TODO: GET CUSTOMER ORDER FROM DATABASE
    /* 1. get customer id from customer table using the global customer variable
       2. get the order row based on customer_id foreign key
       3. assign menu info variables with returned order variable
       4. make sure customer_id is an integer, total is a string, entrees and sides are arrays
    */

    const customer_id = (req.query.customer_id) ? req.query.customer_id : "";
      
    let menu_info = {
      customerId: customer_id,
      total: total,
      entrees: entrees,
      sides: sides
    }

    if (validateMenu(entrees, sides, total)) {
      res.sendStatus(204).json(menu_info);
    } else {
      res.sendStatus(404);
    }

  })
  // ENDPOINT for posting a user's order from the menu page to /api/orders
  .post('/api/orders', (req, res) => {
    // TODO: POST CUSTOMER ORDER TO DATABASE
    /* 1. insert order information into the order table with customer id
       2. 
    */
    const order = req.body;

    if (validateMenu(order.entrees, order.sides)) {
      // TODO: ADD CUSTOMER ORDER TO DATABASE
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }

  })
  // ENDPOINT for updating the confirmation info to DB on order confirmation page
  .put('/api/confirm', async (req, res) => {
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
  // ENDPOINT for customer facing status page using api/order-status
  .get('/api/order-status', async (req, res) => {
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
async function authenticate(username, password) {
  try {
    const client = await pool.connect();
    const results = await client.query("SELECT customer_id, password_hash FROM customer WHERE username ='" + username + "'");
    // If the user is in the database
    if (results.rows.length > 0) {
      return { authorized: (bcrypt.compare(password, results.rows[0].password_hash)), ID: results.rows[0].customer_id };
    }
    client.release();
  } catch (err) {
    console.trace(err);
  } 
  // Otherwise, they are a new user, so we add them to the database and give them access 
  return { authorized: true, ID: addUser(username, password) };
}

// add a new user to the database
async function addUser(username, password) {
  // For an empty table
  var customer_id;

  // Get last customer
  try {
    const client = await pool.connect();
    const results = await client.query("SELECT MAX(customer_id) FROM customer;");
    customer_id = (results.rows[0].max != null) ? results.rows[0].max + 1 : 1;
    client.release();
  } catch (err) {
    console.trace(err);
  }
  // Add new customer to database
  try {
    const client = await pool.connect();
    await client.query("INSERT INTO customer (customer_id, username, password_hash) VALUES(" + customer_id + "," + "'" + username + "' ," + "'" + password + "');");
    client.release();
  } catch (err) {
    console.trace(err);
  }
  return customer_id;
}

// server side validation for the menu page submissions
function validateMenu(entrees, sides, price) {
  return (entrees.length != 0 || sides.length != 0 && price != "$0.00");
}

// server side validaiton for the confirm page submissions
function validateConfirm(order) {
  return (order.length != 0);
}