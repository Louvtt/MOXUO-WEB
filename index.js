const express = require("express");
const bodyParser  = require('body-parser');
const app = express();
const router = express.Router();
const path = require("path");
const fs = require('fs');
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/tasks');
const PORT = 8080;

//main site pages
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+"/index.html"));
});
router.get('/help', (req, res) => {
    res.sendFile(path.join(__dirname+"/help.html"));
});
//Submit new items
router.post("/submit", (req, res) => {
    saveJSON(path.join(__dirname+"/out/item.json"), req.body.itemjson);
    res.send("<h1>Items updated</h1><br/><a href='/'>Go back</a>");
    res.redirect('/');
});
router.get("/submit", (req, res) => {
    res.send("<h1>Items updated</h1><br/><a href='/'>Go back</a>");
    res.redirect('/');
});

router.post('/save', (req, res) => {
    saveJSON("/out/item_tmp.json", req.body.itemjson);
    res.redirect("/");
});

//Get css file
router.get("/main.css", (req, res) => {
    res.sendFile(path.join(__dirname+"/main.css"));
});
//Get js app
router.get("/js/item-manager.js", (req, res) => {
    res.sendFile(path.join(__dirname+"/js/item-manager.js"));
});
//Get favicon
router.get("/img/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname+"/img/favicon.ico"));
});
//Get json files
router.get("/out/item.json", (req, res) => {
    res.sendFile(path.join(__dirname+"/out/item.json"));
});
router.post("/out/item.json", (req, res) => {
    res.sendFile(path.join(__dirname+"/out/item.json"));
});
router.get("/out/item_templates.json", (req, res) => {
    res.sendFile(path.join(__dirname+"/out/item_templates.json"));
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use('/', router);
app.listen(PORT, () => {
    console.log(`App running on http://localhost:${PORT}`);
});



function saveJSON(path, stringified_data) {
    //Since this code executes as root the file being created is read only.
    //chmod() it
    fs.chmod(path, 0666, (error) => {
        console.log('Changed file permissions');
        if(error) throw error;
    });

    if(path && stringified_data != undefined) fs.writeFile(path, stringified_data, (err) => {
        console.log('Changed '+path+' with: '+stringified_data);
        if(err) throw err;
    });

}