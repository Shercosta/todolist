//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://admin-shercosta:Shercosta2001@cluster0.2hrpe6r.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
  }
);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const def1 = new Item({
  name: "MPTI",
});

const def2 = new Item({
  name: "MBD",
});

const def3 = new Item({
  name: "Pemweb",
});

const defaultItems = [def1, def2, def3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, (err, docs) => {
    if (docs.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: docs });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // console.log("Doesn't exist");
        // create a new list

        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();

        res.redirect("/" + customListName);
      } else {
        // Show an existing list

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemEjs = req.body.newItem;
  const listName = req.body.list;

  const itemMongo = new Item({
    name: itemEjs,
  });

  if (listName === "Today") {
    itemMongo.save();

    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(itemMongo);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("successfully deleted");
      }
    });

    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      if (err) {
        console.log(err);
      } else {
        List.findOneAndUpdate(
          { name: listName },
          { $pull: { items: { _id: checkedItemID } } },
          (err, foundList) => {
            if (!err) {
              res.redirect("/" + listName);
            } else {
              console.log(err);
            }
          }
        );
      }
    });
  }

  // Item.deleteOne({_id: checkedItemID}, (err) => {
  //   if(err){
  //     console.log(err);
  //   }else{
  //     console.log("successfully deleted");
  //   }
  // });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started succesfully");
});
