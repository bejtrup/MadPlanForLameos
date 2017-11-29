var graphQLEndpoint = 'https://api.graph.cool/simple/v1/cj7jflnup02bp0138ccetefib';
var userId = "cj7mziq54j6q301057e4go5yg";
var allRecipes = [];
var foodPlan = [];
var groceryList =[];

function fetchAllRecipes() {
  var allRecipesStored = JSON.parse(localStorage.getItem("allRecipes"));
  if(allRecipesStored === null){
    console.log("Getting Data online");
    $.post({
      url: graphQLEndpoint,
      data: JSON.stringify({ "query": "{ allOpskrifts{ id name ingrediensers{ amount ingredienseTypes{ id name bulk group unitses{ name shorthand }  } } } }" }),
      contentType: 'application/json'
    }).done(function(response) {
      allRecipes = response.data;
      adsColorProfileToAllRecipes();
      localStorage.setItem("allRecipes", JSON.stringify(allRecipes));
      initPage();
    });
  } else {
    allRecipes = allRecipesStored;
    console.log("from localStorage");
    initPage();
  }
}

function adsColorProfileToAllRecipes(){
  var count = 1
  allRecipes.allOpskrifts.forEach(function(item){
    item.colorProfile = count;
    count++
    count = count > 15 ? 1 : count;

  });
}

function initPage(){
  makeFrontpage();
  //makeCarouselRecipeCardList();
}

function makeFrontpage() {
  var compiledTemplate = Handlebars.compile( $("#recipe-cards").html() );
  var generatedTemplate = compiledTemplate(allRecipes.allOpskrifts);
  $("#RecipeContainer").html(generatedTemplate);
}

function beginNewFoodplan(recipeId){
  $("#"+recipeId).siblings().remove();
  $("#Carousel").removeClass("d-none");

  $("#"+recipeId).find("#plateWrapper").remove();
  $("#"+recipeId).find("#recipe-cards--stars").remove();
  $("#"+recipeId).find("#recipe-cards--ingridiens").remove();



  // MAKE ELEMENT ABSOLUTE
  // var top = $("#"+recipeId).offset().top - $(window).scrollTop();
  // var left = $("#"+recipeId).offset().left;
  // var height = $("#"+recipeId).outerHeight();

  // $("#"+recipeId).next().css("margin-top", height+32 );
  // $("#"+recipeId).css({
  //   position: "fixed",
  //   top: top,
  //   left: left
  // }).removeClass("ecipe-cards");

  // FOODPLAN DRAW OUT
  // $("#foodPlan-Draw").removeClass("in").addClass("out");
  // $("#Frontpage").addClass("out");
  // EFFECT ON RECIPE Cards
  // window.setTimeout(function(){
  //   $("#"+recipeId).addClass("fadeaway");
  // }, 100);
  // window.setTimeout(function(){
     addToFoodPlan(recipeId)
     $("#CarouselNextPrev").removeClass("d-none");
  //   $("#Frontpage").remove();
  // }, 400);
}


var dist = 140;
function addToFoodPlan(recipeId){
  // MAKE GROCERYLIST
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
  foodPlan.push({day: (foodPlan.length + 1), recipieid: allRecipes.allOpskrifts[indexOfId].id, name: allRecipes.allOpskrifts[indexOfId].name, colorProfile: allRecipes.allOpskrifts[indexOfId].colorProfile});
  allRecipes.allOpskrifts[indexOfId].inFoodplan = true;

  // MAKE FOODPLAN BUILD LIST
  // MAKE HEADER FOR INGRIDIENS LIST
       var compiledTemplate = Handlebars.compile( $("#Foodplan-Build").html() );
       var generatedTemplate = compiledTemplate(foodPlan);
       $("#Foodplan-Build-List").html(generatedTemplate);
  //   // MAKE THE LIST
       makeGroseryListTest("groceryList-to-Test", groceryList);
  // MAKE RECIPES TO TEST
  newOrderArray();
  makeCarouselRecipeCardList();
  makeCarousel();

  return false;
}

function makeGroseryListTest(id, arr){
  arr.sort(SortByGroup);
  var compiledTemplate = Handlebars.compile( $("#groceryListTest").html() );
  var generatedTemplate = compiledTemplate(arr);
  $("#groceryList-to-Test").html(generatedTemplate);
}

function compareActiveRecipeAndGroceryList(activeRecipeID){
    var testGroceryList =[];
    testGroceryList = JSON.parse(JSON.stringify(groceryList));
    if(activeRecipeID != undefined && $("#RecipeContainer #"+activeRecipeID).length === 0 ){
      var activeRecipeIndex = idInArray(allRecipes.allOpskrifts, activeRecipeID);
      var persons = 2;
      allRecipes.allOpskrifts[activeRecipeIndex].ingrediensers.forEach(function(ing){
        var testIngId = ing.ingredienseTypes[0].id;
        var ingrediensersIndex = idInArray(testGroceryList, testIngId);
        if(ingrediensersIndex != undefined){
          // UPDATE GROCERYLIST WITH SIMILAR ITEMS
          var newTotalAmount = groceryList[ingrediensersIndex].amount + (ing.amount*persons);
          testGroceryList[ingrediensersIndex].amount = newTotalAmount;
          var newLeftover = groceryList[ingrediensersIndex].leftover - (ing.amount*persons);
          testGroceryList[ingrediensersIndex].leftover = newLeftover;
          testGroceryList[ingrediensersIndex].isTested = true;
        } else {
          // ADD NEW ITEMS TO GROCERYLIST
          var leftover = ing.ingredienseTypes[0].bulk - (ing.amount*persons);
          testGroceryList.push({ id: ing.ingredienseTypes[0].id, name: ing.ingredienseTypes[0].name, amount:(ing.amount*persons),  unit: ing.ingredienseTypes[0].unitses[0].shorthand, bulk: ing.ingredienseTypes[0].bulk, group: ing.ingredienseTypes[0].group, leftover: leftover, isAddedToList: true});
        }
      });
    }
    makeGroseryListTest(activeRecipeID, testGroceryList);

}

function makeCarouselRecipeCardList(){
  var compiledTemplate = Handlebars.compile( $("#recipe-cards").html() );
  // var arraytosend = [];
  // arraytosend.push(allRecipes);
  // arraytosend.foodPlan = foodPlan;
  // var generatedTemplate = compiledTemplate(arraytosend);
  var generatedTemplate = compiledTemplate(allRecipes.allOpskrifts);
  $("#Recipe-List").html('<div class="previewRecipe"><-swipe</div>');
  $("#Recipe-List").append(generatedTemplate);
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
  $("#Recipe-List").slick({
    dots: false,
    infinite: false,
    slidesToShow: 1,
    slidesToScroll: 1,
    mobileFirst: true,
    adaptiveHeight: true,
    appendArrows: $("#CarouselNextPrev"),
    prevArrow: '<div class="col d-flex align-items-center justify-content-center order-3 slick-prev"><h3 class="m-0"><span aria-hidden="true" class="arrow_right"></h3></span></div>',
    nextArrow: '<div class="col d-flex align-items-center justify-content-center order-1 slick-next"><h3 class="m-0"><span aria-hidden="true" class="arrow_left"></h3></span></div>'
  });

  $("#Recipe-List").on('afterChange', function(event, slick, currentSlide){
    var activeId = $(this).find("div.slick-active").attr("id")
    compareActiveRecipeAndGroceryList(activeId);
  });
}

function makeBulkPicker(id) {
  $("#keypadwrapper").removeClass("d-none");
  window.setTimeout(function(){
     $("#keypad").addClass("up");
     $("#AmountInput").addClass("show");
  }, 100);
  $("#AmountInputIngridiensID").val(id);
  var index = idInArray(groceryList,id);
  $("#AmountInputName").text(groceryList[index].name);
  $("#AmountInputUnit").text(groceryList[index].unit+".");
  $("#AmountInputBulk").text(groceryList[index].bulk);
  $("#AmountInputBulk").addClass("highlight");
  window.setTimeout(function(){

  }, 300);
}
$(document).ready(function(){
  $("#keypad").on("click", ".key", function(){
    var val = $(this).attr('data-val');
    if(val == "submit"){
      var v = $("#AmountInputBulk").text();
      var AmountInputIngridiensID = $("#AmountInputIngridiensID").val();
      var index = idInArray(groceryList,AmountInputIngridiensID);
      var prevBulk = groceryList[index].bulk;
      groceryList[index].bulk = v;
      var prevLeftover = groceryList[index].leftover;
      groceryList[index].leftover = prevLeftover + (v - prevBulk);
      var i = $('#Recipe-List').slick('slickCurrentSlide');
      if(i > 0){
        var currentRecipieId = $("#Recipe-List").find('.recipe-cards:nth-child('+(i+1)+')').attr("id");
      } else {
        var currentRecipieId = $("#RecipeContainer").find(".recipe-cards").attr("id");
      }
      compareActiveRecipeAndGroceryList(currentRecipieId);

      $("#keypad").removeClass("up");
      $("#AmountInput").removeClass("show");
      window.setTimeout(function(){
        $("#keypadwrapper").addClass("d-none");
      }, 200);

    }
    else if(val == "back"){
      var v = $("#AmountInputBulk").text();
      $("#AmountInputBulk").text(v.slice(0,-1));
    } else{
      if($("#AmountInputBulk").hasClass("highlight")){
        $("#AmountInputBulk").text("");
        $("#AmountInputBulk").removeClass("highlight");
        $("#AmountInputBulk").text(val);
      } else {
        var v = $("#AmountInputBulk").text();
        v += val;
        $("#AmountInputBulk").text(v);
      }
    }
  });

  $(document).on("click", ".recipe-cards--card", function (e) {
    if (!$(e.target).closest(".btn").length ) {
      showFullRecipe($(this));
    }
  });


});

function showFullRecipe(elem){
  elem.closest(".recipe-cards--card").addClass("full");
  window.setTimeout(function(){
    //elem.closest(".recipe-cards").siblings().addClass("d-none");
  }, 300);

}
$(document).on("click",".navbar-middle",function(){
  $(".full").removeClass("full");
});
// :::::::::::::::::ALKYRITMEN :::::::::::::::::::
// husk ikke kigge på Basis (+1)
// huske prioter + rest højt (+3)
// husk prioter - rest middle (+2)
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

Handlebars.registerHelper("leftoverColor", function (leftover){
      if (leftover < 0){
        return "text-danger";
      }
      if (leftover == 0){
        return "text-secondary";
      }
      if (leftover > 0){
        return "text-primary";
      }
});
