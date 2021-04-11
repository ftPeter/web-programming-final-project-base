
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
        } else {
          // Unauthorized access
          res.sendStatus(401);
        }
    } catch (error) {
      console.trace(error);
      res.sendStatus(500);
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
    
    const customer_id = (req.params.customer_id) ? req.params.customer_id : "";
      
    let menu_info = {
      customer_id: customer_id,
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
  
    // CREATE ORDER STRING
      
    if (validateConfirm(order)) {
        // Push the new information to the database
        // and get the result for the new order number
        let query_text = "INSERT INTO order_table (c_id, customer_order, status) ";
            query_text += "VALUES ('" + customer_id + "', '" + order + "', 'Received')";
            query_text += "RETURNING c_id;";

        try {
          const client = await pool.connect();

          // INSERT the new order information
          const result = await client.query(query_text);

          // get the new ID number returned from the INSERT query
          const order_number = (result.rows.length > 0) ? result.rows[0].c_id : null; 

          // with the new order number, get the appropriate customer info
          const select_result = await client.query('SELECT * FROM order_table WHERE c_id = ' + order_number);
          const results = (select_result) ? select_result.rows[0] : null;

          const order_status = results.order_status;
          const customer_id = results.c_id;
          const order = results.order;

          let customer_info = {
            customer_id: customer_id,
            order: order,
            ordernumber: order_number,                      
            orderstatus: order_status
          };

          res.json(customer_info);
          client.release();
        } catch (err) {
          console.error(err);
          res.send("Error " + err);
        }
    } else {
        res.send(400);
    }
  })
  // ENDPOINT for getting the status of the order from confirmation page using api/order-status
  .get('/api/order-status', async (req, res) => {
      const customer_id = req.query.customer_id;
     
      // retrieve the order status from database, determined by customer_id
      try {
        const client = await pool.connect();
        const results = await client.query('SELECT status FROM order_table WHERE c_id = ' + customer_id);
        const status = (results.rows.length > 0) ? results.rows[0].status : null;

        res.json({order_status: status});
        client.release();
      } catch (err) {
        console.error(err);
        res.send("Error " + err);
      }
  })
  // ENDPOINT for posting the status of the customer's order to api/order-status
  .put('/api/order-status', async (req, res) => {
    try {
      const customer_id = req.body.customer_id;

      // GET THE CURRENT ORDER_STATUS
      const client = await pool.connect();
      const old_status_result = await client.query('SELECT status FROM order_table WHERE c_id=' + customer_id);
    
      old_status = old_status_result.rows[0].status;

      // POSSIBLE ORDER STATUS LIST
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
      await client.query("UPDATE order_table set status='" + new_status + "' where c_id=" + customer_id);

      res.sendStatus(200); 
      client.release();
    } catch (err) { 
        console.error(err); res.send("Error " + err);
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))


/* * * * * * * * * * * * * * * * * * * * * *  
 *          SERVER-SIDE FUNCTIONS          *
 * * * * * * * * * * * * * * * * * * * * * *  
*/

// validate that the user is using correct login, and if they don't exist in DB, we create a new user
async function authenticate(username, password) {
  let query_text = "SELECT customer_id, password_hash " ;
      query_text += "FROM customer " ;
      query_text += "WHERE username='" + username + "';";
  try {
    const client = await pool.connect();
    const results = await client.query(query_text);
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
  let customer_id = 1;

  // Add new customer to database
  let query_text = "INSERT INTO customer (username, password_hash) ";
      query_text += "VALUES('" + username + "','" + password + "') ";
      query_text += "RETURNING customer_id;"
  try {
    const client = await pool.connect();
    results = await client.query(query_text);
    if (results.rows.length > 0) {
      customer_id = results.rows[0].customer_id;
    }
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