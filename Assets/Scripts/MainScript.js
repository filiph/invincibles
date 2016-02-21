
var buggy : Transform;
var numOfBuggys : int = 20;

function Start() {
	for (var i : int = 0; i < numOfBuggys; i++) {
		for (var j : int = 0; j < numOfBuggys; j++) {
		   	var buggyInstance : Transform = Instantiate (buggy, Vector3(-500 + i * 10.0, 50, 500 + j * 10.0), Quaternion.identity);
		   	
		}
	}
}