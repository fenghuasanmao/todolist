//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//连接并创建数据库
mongoose.connect("mongodb://localhost:27017/listDB",{ useNewUrlParser: true,useUnifiedTopology: true });

//定义Item的Schema
const itemSchema = new mongoose.Schema({
  name:String
});

const otherListSchema = new mongoose.Schema({
  name:String,
  itemList:[itemSchema]
});

//创建Item的表
const Item = mongoose.model("Item",itemSchema);
const List = mongoose.model("List",otherListSchema);

//创建初始三个数据
const item01 = new Item({
name:"buy item01"
});
const item02 = new Item({
name:"buy item02"
});
const item03 = new Item({
name:"buy item03"
});
const itemList = [item01,item02,item03];



app.get("/", function(req, res) {
  Item.find(function(err,items){
    if(err){
      console.log(err);
    }else{
      if(items.length === 0){
        Item.insertMany(itemList,function(err){
          if(err){
            console.log(err);
          }else{
            console.log("Successfully insert the beginning itemlist!");
          }
        });
        res.redirect("/");
      }else{
          res.render("list", {listTitle: "Today", newListItems: items});
      }
    }
  });
});

app.get("/:otherListName",function(req,res){
  const otherListName = req.params.otherListName;
  List.findOne({name:otherListName},function(err,otherList){
    if(err){
      console.log(err);
    }else{
      if(!otherList){
        const newOtherList = new List({
          name:otherListName,
          itemList:itemList
        });
        newOtherList.save();
        res.redirect("/" + otherListName);
      }else {
        res.render("list", {listTitle: otherListName, newListItems: otherList.itemList});
      }
    }
  });
});


app.post("/", function(req, res){
  const postTitle = req.body.list;
  const newItem = new Item({
    name:req.body.newItem
  });
  if(postTitle === "Today"){
    newItem.save();
    res.redirect("/");
  }else {
    List.findOne({name:postTitle},function(err,foundItem){
      foundItem.itemList.push(newItem);
      foundItem.save();
      res.redirect("/" + postTitle);
    });
  }

});

app.post("/delete",function(req,res){
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.deleteOne({_id:req.body.checkbox},function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Delete One item!");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate(
      {name:listName},
      {$pull:
        {itemList:
          {_id:req.body.checkbox}
        }
      },
      function(err){
      if(err){
        console.log(err);
      }else{
        console.log("111");
      }
    },
    {useFindAndModify: false});
    res.redirect("/" + listName);
  }

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
