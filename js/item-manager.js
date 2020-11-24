const item_create_elements = document.querySelectorAll(".new-item-button");
const fade_effect = document.querySelector("#fade");
const modal_editing = document.querySelector("#modal-editing");
const items_path = "out/item.json";
const items_template_path = "out/item_templates.json";
const inner_page = document.querySelector("#inner-page");
const navigation_div = document.querySelector("#navigation");

var itemCreationManager, itemManager, itemNavigation;
function setup() {
    itemManager = new ItemManager();
    itemCreationManager = new ItemCreation();
    itemNavigation = new HTML_navigation(items_path, itemCreationManager, itemManager);
    //itemManager.loadJsonIn(items_path, itemCreationManager, items_template_path);
    document.getElementById("downloadAnchorElem").addEventListener("click", itemManager.save);
}
function loadJsonFile(path, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.overrideMimeType("application/json");
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4 && xhttp.status == "200") {
            console.log("reading ended.");
            var Json_response = JSON.parse(xhttp.responseText);
            callback(Json_response);
        }
    };
    xhttp.open('GET', path, true);
    xhttp.send(null); 
}
function typeToInputType(value) {
    switch(typeof value) {
        case "number":
            return "number";
        case "string":
            return "text"
        case "object":
            if(value instanceof Range)
                return 'range';
            else
                console.log("object");
            break;
        default:
            return 'text';
    }
}
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}
const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}
const navigation_add_events = () => {
    var openers_list = document.getElementsByClassName("list-opener");
    for (let opener_i = 0; opener_i < openers_list.length; opener_i++)
    {
        openers_list[opener_i].addEventListener("click", (e) => {
            var opener = e.target;
            var opener_target = document.querySelector(".list-content[category="+e.target.getAttribute("category")+"]");
            if(opener.classList.contains("open")) {
                opener.classList.remove("open");
                opener_target.classList.remove("open");
    
            }
            else {
                opener.classList.add("open");
                opener_target.classList.add("open");
            }
        });
    }
}

class HTML_navigation {
    constructor(filepath, itemCreator, itManager) {
        this.nav_html = "";
        var xhttp = new XMLHttpRequest();
        xhttp.overrideMimeType("application/json");
        xhttp.onreadystatechange = () => {
            if (xhttp.readyState == 4 && xhttp.status == "200") {
                var Json_response = JSON.parse(xhttp.responseText);
                this.createNavigation(Json_response);
            }
        };
        xhttp.open('GET', filepath, true);
        xhttp.send(null);
        this.itemCreator = itemCreator;
        this.itemManager = itemManager;
    }

    createNavigation(json_data) {
        navigation_div.innerHTML = "";
        this.createCategory("main", null);
        for(var category in json_data)
        {
            this.createCategory(category, "main");
            for(var subcategory in json_data[category]) {
                var is_addEvent_created = false;
                if(json_data[category][subcategory]["name"] != undefined)
                {
                    if(!is_addEvent_created) {
                        this.createAddEvent(category);
                        is_addEvent_created = true;
                    }
                    this.createItem(json_data[category][subcategory]["name"], category, subcategory);
                }else {
                    this.createCategory(subcategory, category);
                    this.createAddEvent(subcategory);
                    for(var item in json_data[category][subcategory])
                    {
                        this.createItem(json_data[category][subcategory][item]["name"], subcategory, item);
                    }
                }
            }
        }
        navigation_add_events();
        this.itemCreator.setup_creation_buttons();
        console.log("navigation created");
        this.itemManager.loadJsonIn(items_path, this.itemCreator, items_template_path);
    }

    createCategory(name, parent) {
        var category_bt = htmlToElement('<span class="list-opener" category="'+name+'"></span>');
        var category_name = htmlToElement('<span class="list-name" category="'+name+'">'+capitalize(name)+'</span>');
        var category_elmt = htmlToElement(`<div class="list-content" category="${name}"></div>`);
        if(parent == null || parent == "" || parent == undefined) {
            navigation_div.appendChild(category_bt);
            navigation_div.appendChild(category_name);
            navigation_div.appendChild(category_elmt);
        } else {
            var parent_node = document.querySelector(`.list-content[category=${parent}]`);
            parent_node.appendChild(category_bt);
            parent_node.appendChild(category_name);
            parent_node.appendChild(category_elmt);
        }
    }

    createItem(name, parent, id) {
        var n_item = document.createElement("span");
        n_item.classList.add("new-item");
        n_item.setAttribute("item-id", id);
        n_item.innerHTML = name;
        n_item.addEventListener("click", () => {this.itemCreator.loadPage(parent, id)});
        document.querySelector(`.list-content[category=${parent}]`).appendChild(n_item);
    }

    createAddEvent(parent) {
        if(parent != undefined) {
            var add_elmt = htmlToElement('<span class="new-item-button" category="'+parent+'"></span>');
            document.querySelector(`.list-content[category=${parent}]`).appendChild(add_elmt);   
        }
    }
} 


var ItemCreation = function() {
    this.createButtons = item_create_elements;
    this.is_editing = false;
    this.currentPage = {
        "category": "",
        "id": ""
    };
    this.lastType = "";

    this.setup_creation_buttons = () => {
        this.createButtons = document.querySelectorAll(".new-item-button");
        for(var item_i = 0; item_i < this.createButtons.length; item_i++) {
            this.createButtons[item_i].addEventListener("click", (e) => {
                console.log("creating item ?", !this.is_editing);
                if(!this.is_editing) {
                    this.is_editing = true;
                    var type = e.target.getAttribute("category");
        
                    modal_editing.classList.add("active");
                    fade_effect.classList.add("active");
        
                    this.create_item(type);
                }
            });
        }
    };

    this.create_item = (type) => {
        //console.log(new_item);
    
        this.lastType = type;
        fade_effect.addEventListener("click", this.cancelAdd);
        modal_editing.children[1].addEventListener("keyup", this.inputAddEvents);
        modal_editing.children[2].addEventListener("click", this.validateAddEvent);
    };

    this.validateAddEvent = (e) => {
        var type = this.lastType;
        var list_parent = document.querySelector(`.list-content[category=${type}]`);
        var new_item = document.createElement("span");
        if(!modal_editing.children[2].classList.contains("disabled")) {
            console.log("waw2");
            var selected_item_name = modal_editing.children[1].value;
            new_item.classList.add("new-item");
            new_item.innerHTML = selected_item_name;
            new_item.setAttribute("item-id", selected_item_name.toLowerCase().replace(" ", "_"));
            new_item.addEventListener("click", () => {this.loadPage(type, selected_item_name.toLowerCase().replace(" ", "_"))});
            list_parent.append(new_item);
            itemManager.addItem(type, selected_item_name.toLowerCase().replace(" ", "_"), selected_item_name);
            this.end_item_creation();
        }
    }

    this.inputAddEvents = (e) => {
        var type = this.lastType;
        var list_parent = document.querySelector(`.list-content[category=${type}]`);
        var new_item = document.createElement("span");
        var selected_item_name = modal_editing.children[1].value; //Name value
            if(selected_item_name.replace(" ", "") != "") modal_editing.children[2].classList.remove("disabled")
            else modal_editing.children[2].classList.add("disabled");
    
            if(e.keyCode == 13) { //Enter
                if(selected_item_name.replace(" ", "") != "") {
                    console.log("waw1");
                    var selected_item_name = modal_editing.children[1].value;
                    new_item.classList.add("new-item");
                    new_item.innerHTML = selected_item_name;
                    new_item.setAttribute("item-id", selected_item_name.toLowerCase().replace(" ", "_"));
                    new_item.addEventListener("click", () => {this.loadPage(type, selected_item_name.toLowerCase().replace(" ", "_"))});
                    list_parent.append(new_item);
                    itemManager.addItem(type, selected_item_name.toLowerCase().replace(" ", "_"), selected_item_name);
                    this.end_item_creation();
                }
            }
            else if(e.keyCode == 27) {//Escape 
                new_item.remove();
                this.end_item_creation();
            }
    }

    this.cancelAdd = () => {
        this.end_item_creation();
    }

    this.end_item_creation = () => {
        modal_editing.children[1].removeEventListener("keyup", this.inputAddEvents);
        modal_editing.children[2].removeEventListener("click", this.validateAddEvent);
        fade_effect.removeEventListener("click", this.cancelAdd);
        
        modal_editing.classList.remove("active");
        fade_effect.classList.remove("active");
        this.is_editing = false;
    };

    this.addItem = (category, name, id) => {
        var n_item = document.createElement("span");
        n_item.classList.add("new-item");
        n_item.setAttribute("item-id", id);
        n_item.innerHTML = name;
        n_item.addEventListener("click", () => {this.loadPage(category, id)});
        document.querySelector(`.list-content[category=${category}]`).append(n_item);
    }

    this.loadPage = (category, id) => {
        if(this.currentPage["category"] == "") {
            this.currentPage["category"] = category;
            this.currentPage["id"] = id;
        } else if(this.currentPage["category"] != category || this.currentPage["id"] != id) {
            this.savePage(this.currentPage["category"], this.currentPage["id"]);

            this.currentPage["id"] = id;
            this.currentPage["category"] = category;
        }

        var item_infos = itemManager.getItem(category, id);
        var itemHTMLPage = "";

        itemHTMLPage += `<p class="item-id">${id}<p>`;
        for(var key in item_infos)
        {
            if(key == 'name')          itemHTMLPage += `<h2>${item_infos.name}</h2>`;
            else if(key == 'desc')     itemHTMLPage += `<div class="item-attribute-box"><label>Description:</label><textarea id="desc">${item_infos.desc}</textarea></div>`;
            else if(key == 'rarity')   itemHTMLPage += `<div class="item-attribute-box"><label>Rarity:</label><select id="rarity"><option value="COMMON" ${(item_infos[key]=='COMMON') ? 'selected': ''}>COMMON</option><option value="UNCOMMON" ${(item_infos[key]=='UNCOMMON') ? 'selected': ''}>UNCOMMON</option><option value="RARE" ${(item_infos[key]=='RARE') ? 'selected': ''}>RARE</option><option value="EPIC" ${(item_infos[key]=='EPIC') ? 'selected': ''}>EPIC</option></select></div>`;
            else if(key == 'modifiers') {
                itemHTMLPage += `<div class="item-attribute-box"><label>Modifiers:</label><table cellspacing="0" cellpadding="0"><tbody>`;
                for(var modifier_i in item_infos[key]) {
                    var modifier = item_infos[key][modifier_i];
                    var modifier_name = Object.keys(modifier)[0];
                    console.log(modifier_name);
                    itemHTMLPage += `<tr><td>${capitalize(modifier_name)}</td><td><input id="modifier-${modifier_name}" type="text" value="${modifier[modifier_name]}"/></td></tr>`;
                }
                itemHTMLPage += '</tbody></table></div>';
            }
            else                       itemHTMLPage += `<div class="item-attribute-box"><label>${capitalize(key)}:</label><input type="${typeToInputType(item_infos[key])}" id="${key}" value="${item_infos[key]}"/></div>`;
        }
        inner_page.innerHTML = itemHTMLPage;
    }

    this.savePage = (category, id) => {
        var item_infos = {};
        var item_inputs = inner_page.querySelectorAll(".item-attribute-box");
        //console.log(item_inputs);
        for(var box_i = 0; box_i < item_inputs.length; box_i++) {
            var box = item_inputs[box_i];
            var key_name = box.children[1].getAttribute("id");
            var key_value = box.children[1].value;
            item_infos[key_name] = key_value;
        }
        itemManager.setItem(category, id, item_infos);
    }
}

let ItemManager = function() {
    this.item_list_json = "";
    this.selected_item = -1;
    this.item_list;
    this.item_templates;
    this.itemCreator;
    
    this.loadJsonIn = (path, itemCreator, template_path) => {
        this.itemCreator = itemCreator;
        loadJsonFile(path, (json_response, manager = this) => {
            manager.item_list = json_response;
        });
        loadJsonFile(template_path, (json_res, manager = this) => {
            manager.item_templates = json_res;
        });
    };

    /*this.loadItemList = () => {
        /*for(var category in this.item_list) {
            for(var item in this.item_list[category]) {
                this.itemCreator.addItem(category, this.item_list[category][item].name, item);
            }
        }

        for(var category in this.item_list)
        {
            for(var sub in this.item_list[category]) {
                if(this.item_list[category][sub].hasOwnProperty("name")) //Item
                    this.itemCreator.addItem(category, this.item_list[category][sub].name, sub);
                else {
                    for(var item in this.item_list[category][sub])
                        this.itemCreator.addItem(category, this.item_list[category][sub][item].name, item);
                }
            }
        }
    }*/

    this.getItem = (category, name) => {
        var infos = {};
        if(this.item_list.hasOwnProperty(category) && this.item_list[category].hasOwnProperty(name)) {
            for(var key in this.item_list[category][name])
            {
                infos[key] = this.item_list[category][name][key];
            }
        } else { //Search in subCategories
            for(var mainCategory in this.item_list)
            {
                if(this.item_list[mainCategory].hasOwnProperty(category) && this.item_list[mainCategory][category].hasOwnProperty(name)) {
                    for(var key in this.item_list[mainCategory][category][name])
                    {
                        infos[key] = this.item_list[mainCategory][category][name][key];
                    }
                }
            }
        }
        return infos;
    };

    this.setItem = (category, name, data) => {
        if(this.item_list.hasOwnProperty(category) && this.item_list[category].hasOwnProperty(name)) {
            for(var key in this.item_list[category][name])
            {
                if(key!= "name") this.item_list[category][name][key] = data[key];
            }
        } else { //Search in subCategories
            for(var mainCategory in this.item_list)
            {
                if(this.item_list[mainCategory].hasOwnProperty(category) && this.item_list[mainCategory][category].hasOwnProperty(name)) {
                    for(var key in this.item_list[mainCategory][category][name])
                    {
                        if(key!= "name") this.item_list[mainCategory][category][name][key] = data[key];
                    }
                }
            }
        }
    }

    this.addItem = (category, name_id, name) => {
        if(this.item_list.hasOwnProperty(category) && !this.item_list[category].hasOwnProperty(name)) {
            var template_data = this.item_templates[category]["name_id"];
            template_data['name'] = name;
            this.item_list[category][name_id] = template_data;
        } else { //Add in subCategories
            for(var mainCategory in this.item_list)
            {
                if(this.item_list[mainCategory].hasOwnProperty(category) && !this.item_list[mainCategory][category].hasOwnProperty(name)) {
                    var template_data = this.item_templates[mainCategory][category]["name_id"];
                    template_data['name'] = name;
                    this.item_list[mainCategory][category][name_id] = template_data;
                }
            }
        } 
    }

    this.printItems = () => {
        for(var category in this.item_list) {
            console.log("--"+category+"--");
            for(var item in this.item_list[category])
            {
                console.log(item);
                for(var key in this.item_list[category][item]) {
                    console.log("-"+key+":"+this.item_list[category][item][key]);
                }
            }
        }
    }

    this.save = () => {
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.item_list));
        var dlAnchorElem = document.getElementById('downloadAnchorElem');
        dlAnchorElem.setAttribute("href",     dataStr     );
        dlAnchorElem.setAttribute("download", "items.json");
        dlAnchorElem.click();
    }
}

navigation_add_events();
setup();