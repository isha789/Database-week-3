const express = require("express");
const { Pool, Client } = require("pg");
const bodyParser = require('body-parser');
const e = require("express");
const PORT = 3000;
const app = express();

//app.use(express.bodyParser());
//app.use(express.json())
  
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cyf_ecommerce',
    password: 'isha',
    port: 5432
});

app.use(bodyParser.json())

app.get("/customers", function(req, res) {
    pool.query('SELECT * FROM customers', (error, result) => {
        res.json(result.rows);
    });
});

app.get("/suppliers", function(req, res) {
    pool.query('SELECT * FROM suppliers', (error, result) => {
        res.json(result.rows);
    });
});


app.get("/products", function(req, res) {
    pool.query('SELECT products.product_name, suppliers.supplier_name FROM products JOIN suppliers ON products.supplier_id = suppliers.id ', (error, result) => {
        res.json(result.rows);
    });
});
//this is correct one
app.get("/products", async (req, res) => {
    try {
       
        const getProducts = await pool.query("SELECT products.product_name, suppliers.supplier_name FROM products JOIN suppliers ON products.supplier_id = suppliers.id");
        res.json(getProducts.rows);
    } catch (err) {
        console.error(err.message);
    }
})


  //Update the previous GET endpoint /products to filter the list of products by name using a query parameter, for example /products?name=Cup. 
  //This endpoint should still work even if you don't use the name query parameter!
  app.get("/products", (req, res) =>{
    const newproduct = req.query.productname
    const allproducts= "select products.product_name,suppliers.supplier_name from products INNER join suppliers on products.supplier_id=suppliers.id"
    const productByName= "select products.product_name,suppliers.supplier_name from products INNER join suppliers on products.supplier_id=suppliers.id " +
    "where products.product_name like $1"
    console.log(newproduct)
    if(newproduct){
        pool.query(productByName, [ '%' +newproduct + '%'])
        .then(result => res.json(result.rows))
        .catch(error => console.log("Something is wrong " + error));
    }
    else{
    pool.query(allproducts)
    .then(result => res.json(result.rows))
    .catch(error => console.log("Something is wrong " + error));
    }
   
  })


//Add a new GET endpoint /customers/:customerId to load a single customer by ID.

app.get("/customers/:customerId", (req,res) => {
    const customerId = req.params.customerId;

    const customersById = "select * from customers where id = $1"

    pool.query(customersById, [customerId])
    .then((result) => {
        if(result.rows.length > 0){
            res.json(result.rows)
        }
        else{
            res.status(400).send(`ID does not exist`);
        }
    })
    .catch((error) => console.log("something is wrong" + error));
})


//Add a new POST endpoint /customers to create a new customer.

app.post("/customers", (req, res) => {
    const name = req.body.name;
    const address = req.body.address;
    const city = req.body.city;
    const country = req.body.country;

    const createCustomer = "Insert into customers (name, address, city, country) Values ($1, $2, $3, $4)";
    pool.query(createCustomer, [name, address, city, country])
    .then(() => res.send("customer created!"))
    .catch(error => res.send(error.message));
});


//Add a new POST endpoint /products to create a new product (with a product name, a price and a supplier id). 
//Check that the price is a positive integer and that the supplier ID exists in the database, otherwise return an error.

app.post("/products", function(req, res){
    const newProductName = req.body.name;
    const newProductUnitprice = req.body.unit_price;
    const newProductSupplierId= req.body.supplier_id;

   if (!Number.isInteger(newProductUnitprice) || newProductUnitprice<=0 ){
    return res
    .status(400)
    .send("the unit price must be an integer")
    }
pool.query("select * from products")

})







// Add a new POST endpoint /customers/:customerId/orders to create a new order (including an order date, and an order reference)
// for a customer. Check that the customerId corresponds to an existing customer or return an error.
app.post("/customers/:customerId/orders", (req, res) => {
    let customerId = req.params.customerId;

    let orderDate = req.body.order_date;
    let orderRef = req.body.order_reference;
    console.log("Id " + customerId);

    const checkCustomer = "select * from customers where id = $1"
    const insertOrder = "insert into orders(order_date, order_reference, customer_id) values($1, $2, $3)";

    pool.query(checkCustomer, [customerId])
        .then(result => {
            if (result.rows.length > 0) {
                pool.query(insertOrder, [orderDate, orderRef, customerId])
                    .then(() => res.send("Order created"))
                    .catch(error => console.error("Something is wrong when adding new order" + error))
            } else {
                res.status(400).send("Customer id " + customerId + " does not exist")
            }
        })
        .catch(error => console.error("Something is wrong " + error))

})
// Add a new GET endpoint /customers/:customerId/orders to load all the orders along the items in the orders of a specific customer.
// Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.
app.get("/customers/:customerId/orders", (req, res) => {
    let customerId = req.params.customerId;

    const getCustomerOrders = "select o.order_reference, o.order_date, p.product_name, p.unit_price, s.supplier_name " +
        "from orders o join order_items oi on o.id = oi.order_id " +
        "join products p on p.id = oi.product_id " +
        "join suppliers s on p.supplier_id = s.id " +
        "where o.customer_id = $1"

    pool.query(getCustomerOrders, [customerId])
        .then(result => res.json(result.rows))
        .catch(error => console.error("Something is wrong " + error))
});

//Add a new PUT endpoint /customers/:customerId to update an existing customer (name, address, city and country).

app.put('/customers/:customerId', (req, res) => {
    const customerId = req.params.customerId;
    const newEmail = req.body.email;
    const newCity = req.body.city;

    const updateCustomer = "UPDATE customers set email = $1, city = $2 where id = $3";

    pool.query(updateCustomer, [newEmail, newCity, customerId])
        .then(() => res.send("Customer updated!"))
        .catch(error => res.error(error.message));

})



app.listen(PORT, function () {
    console.log(`Your app is listening on port ${PORT}`);
});