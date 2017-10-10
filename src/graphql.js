var graphQLEndpoint = 'https://api.graph.cool/simple/v1/cj7jflnup02bp0138ccetefib';
var userId = "cj7mziq54j6q301057e4go5yg";
var allRecipes = [];
var foodPlan = [];
var groceryList =[];


function fetchAllRecipes() {
  $.post({
    url: graphQLEndpoint,
    data: JSON.stringify({ "query": "{ allOpskrifts{ id name ingrediensers{ amount ingredienseTypes{ id name bulk group unitses{ name shorthand }  } } } }" }),
    contentType: 'application/json'
  }).done(function(response) {
      allRecipes = response.data;
      adsColorProfileToAllRecipes();
      initPage();
  });
}


function adsColorProfileToAllRecipes(){
  var count = 1
  allRecipes.allOpskrifts.forEach(function(item){
    item.colorProfile = count;
    count++
    count = count > 5 ? 1 : count;

  });
}


function initPage(){
  makePreviewRecipeList();

}
function addToFoodPlan(recipeId){
  var indexOfId = idInArray(allRecipes.allOpskrifts, recipeId);
  var persons = 2;
  allRecipes.allOpskrifts[indexOfId].ingrediensers.forEach(function (v) {
     var indexOfgros = idInArray(groceryList, v.ingredienseTypes[0].id);
     if(indexOfgros >= 0){
       var i = groceryList[indexOfgros].amount + (v.amount*persons);
       groceryList[indexOfgros].amount = i;
       if(groceryList[indexOfgros].bulk) {
         var newLeftover = groceryList[indexOfgros].leftover - (v.amount*persons);
         groceryList[indexOfgros].leftover = newLeftover;
       }
     }
     else{
       var leftover = v.ingredienseTypes[0].bulk - (v.amount*persons)
       groceryList.push({id: v.ingredienseTypes[0].id, name: v.ingredienseTypes[0].name, amount: (v.amount*persons), unit: v.ingredienseTypes[0].unitses[0].shorthand, bulk: v.ingredienseTypes[0].bulk, group: v.ingredienseTypes[0].group, leftover: leftover });
     }
  });
  foodPlan.push({day: (foodPlan.length + 1), recipieid: allRecipes.allOpskrifts[indexOfId].id, name: allRecipes.allOpskrifts[indexOfId].name});
  allRecipes.allOpskrifts[indexOfId].inFoodplan = true;

  newOrderArray();
  makePreviewRecipeList();
  makeCarousel();
  makeGroseryListTest("foodplan", groceryList);

  return false;
}

function compareActiveRecipeAndGroceryList(activeRecipeID){
  var testGroceryList =[];
  testGroceryList = JSON.parse(JSON.stringify(groceryList));
  if(activeRecipeID != "foodplan"){
      var activeRecipeIndex = idInArray(allRecipes.allOpskrifts, activeRecipeID);
      var persons = 2;
      allRecipes.allOpskrifts[activeRecipeIndex].ingrediensers.forEach(function(ing){
        var testIngId = ing.ingredienseTypes[0].id;
        var ingrediensersIndex = idInArray(testGroceryList, testIngId);
        if(ingrediensersIndex != undefined){
          var newTotalAmount = groceryList[ingrediensersIndex].amount + (ing.amount*persons);
          testGroceryList[ingrediensersIndex].amount = newTotalAmount;
          var newLeftover = groceryList[ingrediensersIndex].leftover - (ing.amount*persons);
          testGroceryList[ingrediensersIndex].leftover = newLeftover;
          testGroceryList[ingrediensersIndex].isTested = true;
        } else {
          var leftover = ing.ingredienseTypes[0].bulk - (ing.amount*persons);
          testGroceryList.push({ id: ing.ingredienseTypes[0].id, name: ing.ingredienseTypes[0].name, amount:(ing.amount*persons),  unit: ing.ingredienseTypes[0].unitses[0].shorthand, bulk: ing.ingredienseTypes[0].bulk, group: ing.ingredienseTypes[0].group, leftover: leftover, isAddedToList: true});
        }
      });
  }
  makeGroseryListTest(activeRecipeID, testGroceryList);
}

function makePreviewRecipeList(){
  var compiledTemplate = Handlebars.compile( $("#previewRecipes").html() );
  var arraytosend = [];
  arraytosend.push(allRecipes);
  arraytosend.foodPlan = foodPlan;
  var generatedTemplate = compiledTemplate(arraytosend);
  $("#recipe-list").html(generatedTemplate);
}
function makeGroseryListTest(id, arr){

  arr.sort(SortByGroup);

  var compiledTemplate = Handlebars.compile( $("#groceryListTest").html() );
  var generatedTemplate = compiledTemplate(arr);
  $("#"+id+" .grocery-test-list").html(generatedTemplate);
}

function SortByGroup(a, b) {
  var aSize = a.group;
  var bSize = b.group;
  var aLow = a.name;
  var bLow = b.name;

  if(aSize == bSize)
  {
      return (aLow < bLow) ? -1 : (aLow > bLow) ? 1 : 0;
  }
  else
  {
      return (aSize < bSize) ? -1 : 1;
  }
}

function makeCarousel(){
  $("li#foodplan").removeClass("hidden");
  $("div#Carousel").addClass("Carousel");
  $("#recipe-list").itemslide({
      //start: 1,
      one_item: true,
      duration: 500,
  });
  $(window).resize(function () {
        $("#recipe-list").reload();

    });
  $("#recipe-list").on('changeActiveIndex', function(e) {
          //console.log( $("#recipe-list").getActiveIndex() );
          var activeId = $("li.itemslide-active").attr("id")
          compareActiveRecipeAndGroceryList(activeId);
  });
}
function newOrderArray(){
  groceryList.forEach(function(item){
    allRecipes.allOpskrifts.forEach(function(recipe){
      if(!recipe.groceryMatch ) {recipe.groceryMatch = 0;}
      recipe.ingrediensers.forEach(function(ingridiens){
        if(item.id === ingridiens.ingredienseTypes[0].id){
            var i = recipe.groceryMatch + 1 ;
            recipe.groceryMatch = i;
        }
      });
    });
  });
  allRecipes.allOpskrifts.sort(SortByGroceryMatch).reverse();
}
function SortByGroceryMatch(a, b){
  var aName = a.groceryMatch;
  var bName = b.groceryMatch;
  return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}
function idInArray(arr,value){
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].id === value) {
      return i;
    }
  }
}
var currentGroup = '';
Handlebars.registerHelper("groceryGroup", function (group){
    if ( currentGroup == group) {
      return null
    } else {
      currentGroup = group
      var name;
      switch(group) {
          case 0:
              name = "Basis"
              break;
          case 1:
              name = "Kød"
              break;
          case 2:
              name = "Frugt og grønt "
              break;
          case 3:
              name = "Tørstof"
              break;
          case 4:
              name = "Væske"
              break;
      }
      return name;
    }
});
