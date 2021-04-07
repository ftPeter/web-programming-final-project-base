
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require("jwt-simple");
const path = require('path');
const router = express.Router()
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

express()
  .use(express.static(path.join(__dirname, 'public'), {
    index: false
  }))
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use("/api", router)
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/test', (req, res) => res.render('pages/test', { users: ["John", "Paul", "Ringo"] }))
  .get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/signin/sign_in.html'));
  })
  // ENDPOINT for user authentication in signin page
  .post("/api/auth", (req, res) => { 
    const username = req.body.username;
    const password = req.body.password;

    const payload = {
      username: username,
      password: password
    }
    
    const token = jwt.encode(payload, secret);

    if (authenticate(username, password)) {
      res.json({token: token});
    } else {
      // Unauthorized access
      res.status(401);
    }
  })
  // ENDPOINT for user signout
  .get("/api/logout", (req, res) => {
      // TODO: set up authorization endpoint to sign out the user
  })
  // ENDPOINT for retrieving a user's order from /api/orders
  .get('/api/orders', (req, res) => {
    const customer_id = (req.query.customer_id) ? req.query.customer_id : "";
    const price = (req.query.price) ? req.query.price : "0.00";

    let entrees = "";
    let sides = "";
    let order = "";
    
      if (req.query.entree || req.query.sides) {
        entrees = getEntrees(req.query.entrees);
        sides = getSides(req.query.sides);
        order = getOrder(entree, sides);
      }
      
      let menu_info = {customerId: customer_id,
                       order: order}

      if (validateMenu(customer_id, entree, sides)) {
        let confirm_info = menu_info;

        res.render('pages/confirmation', confirm_info);
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

    let menu_info = {customerId: customer_id,
                       order: {entrees: entrees, sides: sides, price: price}}

    if (validateMenu(customer_id, entrees, sides)) {
      let confirm_info = menu_info;
      res.render('pages/confirmation', confirm_info);
    } else {
      res.sendStatus(400);
    }

  })
  // ENDPOINT for posting the confirmation info on order confirmation page
  .post('/api/confirm', async (req, res) => {
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


/* * * * * * * * * * * * * * * * * * * * * *  
 *          SERVER-SIDE FUNCTIONS          *
 * * * * * * * * * * * * * * * * * * * * * *  
*/

// validate that the user exists in the database and is using correct login
function authenticate(username, password) {
  // TODO: set up user authentication
  return true;
}

// Add a new user to the database
function addUser(username, password) {

}

// server side validation for the menu page submissions
function validateMenu(customer_id, entrees, sides) {
  const customer_token = window.localStorage.getItem("token");
  return (entrees.length != 0 || sides.length != 0 && customer_id === customer_token);
}

// server side validaiton for the confirm page submissions
function validateConfirm(customer_id, order) {
  const customer_token = window.localStorage.getItem("token");
  return (order.length != 0 && customer_id === customer_token);
}

// build a single string formatted order from the 
// entree and sides
// Implement this
function getOrder(entrees, sideList) {
    order = entrees;

    sideList.forEach(function(r) {
        order += ", " + r;
    });
    return order;
}

// convert the item's buttons into strings
// for each of the side dishes

// TODO!!!
function getSides(body) {
    let sides = [];

    return sides;
}

// get the entrees from the customer order

// TODO!!!
function getEntrees(body) {
  let entrees = [];

  return entrees;
}

// get the price total for the order

// TODO!!!
function getTotal(body) {
  let price = 0;
  let items;

  return price;
}