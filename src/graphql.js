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

function makePreviewRecipeList(){
  var compiledTemplate = Handlebars.compile( $("#previewRecipes").html() );
  var generatedTemplate = compiledTemplate(allRecipes);
  $("#recipe-list").html(generatedTemplate);
}

function addToFoodPlan(recipeId){
  var indexOfId = idInArray(allRecipes.allOpskrifts, recipeId);
  allRecipes.allOpskrifts[indexOfId].ingrediensers.forEach(function (v) {
     var indexOfgros = idInArray(groceryList, v.ingredienseTypes[0].id);
     if(indexOfgros >= 0){
       var i = groceryList[indexOfgros].amount + v.amount;
       groceryList[indexOfgros].amount = i;
     }
     else{
       groceryList.push({id: v.ingredienseTypes[0].id, name: v.ingredienseTypes[0].name, amount: v.amount, unit: v.ingredienseTypes[0].unitses[0].shorthand, bulk: v.ingredienseTypes[0].bulk });
     }
  });
  allRecipes.allOpskrifts[indexOfId].inFoodplan = true;
  foodPlan.push(allRecipes.allOpskrifts[indexOfId]);
  updatePageHeadline();
  newOrderArray();
  makePreviewRecipeList();
  makeCarousel();
  compareActiveRecipeAndGroceryList(allRecipes.allOpskrifts[0].id);
  return false;
}

function compareActiveRecipeAndGroceryList(activeRecipeID){
  var testGroceryList =[];
  testGroceryList = JSON.parse(JSON.stringify(groceryList));
  if(activeRecipeID != "foodplan"){
      var activeRecipeIndex = idInArray(allRecipes.allOpskrifts, activeRecipeID);

      allRecipes.allOpskrifts[activeRecipeIndex].ingrediensers.forEach(function(ing){
        var testIngId = ing.ingredienseTypes[0].id;
        var ingrediensersIndex = idInArray(testGroceryList, testIngId);
        if(ingrediensersIndex != undefined){
          var newTotalAmount = groceryList[ingrediensersIndex].amount + ing.amount;
          testGroceryList[ingrediensersIndex].amount = newTotalAmount;
        } else {
          testGroceryList.push({ id: ing.ingredienseTypes[0].id, name: ing.ingredienseTypes[0].name, amount:ing.amount,  unit: ing.ingredienseTypes[0].unitses[0].shorthand, bulk: ing.ingredienseTypes[0].bulk , isTested: true});
        }
      });
  }
  var compiledTemplate = Handlebars.compile( $("#groceryList").html() );
  var generatedTemplate = compiledTemplate(testGroceryList);
  $("#grocery-list").html(generatedTemplate);
}

function updatePageHeadline(){
  var H = "Vælg ret til "+(foodPlan.length+1)+". dag";
  $("#pageHeadline").text(H);
  return false;
}

function makeCarousel(){
  $("li#foodplan").removeClass("hidden");
  $("div#Carousel").addClass("Carousel");
  $("#recipe-list").itemslide({
      start: 1,
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
