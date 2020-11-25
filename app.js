const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const PORT = 8080;
const fs = require('fs');

//main site pages
router.get('/', (req, res) => {
    res.sendFile("/index.html");
});
router.get('/help', (req, res) => {
    res.sendFile("/help.html");
});
//Submit new items
router.post("/submit", (req, res) => {
    //console.log("Oh you are saving the new items, interesting");
    //console.log(req.body.itemjson);
    saveJSON("/out/item.json", req.body.itemjson);
    res.send("<h1>Items updated</h1><br/><a href='/'>Go back</a>");
    res.redirect('/');
});

router.post('/save', (req, res) => {
    saveJSON("/out/item_tmp.json", req.body.itemjson);
    res.redirect("/");
});

//Get css file
router.get("/main.css", (req, res) => {
    res.sendFile("/main.css");
});
//Get js app
router.get("/js/item-manager.js", (req, res) => {
    res.sendFile("/js/item-manager.js");
});
//Get favicon
router.get("/img/favicon.ico", (req, res) => {
    res.headersSent({
        'Content-type': 'img/x-icon'
    });
    res.sendFile("/img/favicon.ico");
});
//Get json files
router.get("/out/item.json", (req, res) => {
    res.sendFile("/out/item.json");
});
router.get("/out/item_templates.json", (req, res) => {
    res.sendFile("/out/item_templates.json");
});

app.use(express.json())
app.use(express.urlencoded())
app.use('/', router);
app.listen(PORT, () => {
    console.log(`App running on http://localhost:${PORT}`);
});


function saveJSON(path, stringified_data) {
    if(stringified_data != undefined) fs.writeFile(path, stringified_data, (err) => {
        if(err) throw err;
    });
}