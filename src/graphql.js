var graphQLEndpoint = 'https://api.graph.cool/simple/v1/cj7jflnup02bp0138ccetefib';
var userId = "cj7mziq54j6q301057e4go5yg";
var allRecipes = [];
var foodPlan = [];
var groceryList =[];


function fetchAllRecipes() {
  $.post({
    url: graphQLEndpoint,
    data: JSON.stringify({ "query": "{ allOpskrifts{ id name ingrediensers{ amount ingredienseTypes{ id name bulk unitses{ name shorthand }  } } } }" }),
    contentType: 'application/json'
  }).done(function(response) {
      allRecipes = response.data;
      initPage();
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
       leftover = leftover > 0 ? leftover : '';
       groceryList.push({id: v.ingredienseTypes[0].id, name: v.ingredienseTypes[0].name, amount: (v.amount*persons), unit: v.ingredienseTypes[0].unitses[0].shorthand, bulk: v.ingredienseTypes[0].bulk, leftover: leftover });
     }
  });
  foodPlan.push(allRecipes.allOpskrifts[indexOfId]);
  allRecipes.allOpskrifts[indexOfId].inFoodplan = true;
  updatePageHeadline();
  newOrderArray();
  makePreviewRecipeList();
  makeCarousel();
  makeGroseryListTest(groceryList);
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
          leftover = leftover > 0 ? leftover : '';
          testGroceryList.push({ id: ing.ingredienseTypes[0].id, name: ing.ingredienseTypes[0].name, amount:(ing.amount*persons),  unit: ing.ingredienseTypes[0].unitses[0].shorthand, bulk: ing.ingredienseTypes[0].bulk, leftover: leftover, isAddedToList: true});
        }
      });
  }
  makeGroseryListTest(testGroceryList);
}

function updatePageHeadline(){
  var H = "Vælg ret til "+(foodPlan.length+1)+". dag";
  $("#pageHeadline").text(H);
  return false;
}
function makePreviewRecipeList(){
  var compiledTemplate = Handlebars.compile( $("#previewRecipes").html() );
  var generatedTemplate = compiledTemplate(allRecipes);
  $("#recipe-list").html(generatedTemplate);
}
function makeGroseryListTest(arr){
  var compiledTemplate = Handlebars.compile( $("#groceryListTest").html() );
  var generatedTemplate = compiledTemplate(arr);
  $("#grocery-list").html(generatedTemplate);
}
function makeCarousel(){
  $("li#foodplan").removeClass("hidden");
  $("div#Carousel").addClass("Carousel");
  $("#recipe-list").itemslide({
      //start: 1,
      duration: 500,
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
