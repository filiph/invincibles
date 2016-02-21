
var id : int;

var FrontLeftWheel : WheelCollider;
var FrontRightWheel : WheelCollider;

var RearLeftWheel : WheelCollider;
var RearRightWheel : WheelCollider;

var bodyMaterial : Material;
var Body : GameObject;

var EngineTorque : float = 50.0;

var LowerCenterOfMassBy : float = 0.0;
var ForwardCenterOfMassBy : float = 0.0;

var alive : boolean = true;

var isPlayerControlled : boolean = false;
var controlAxis : String;
var aiDangerousZone : float = 10.0;
var aiMeanie : float = 2.0; // the bigger the number, the more likely the ai car will stay with current target
var aiUpdateFrequency : int = 10;

var suspensionSpring : int = 1000;
var suspensionDamper : float = 2;
var suspensionTargetPosition : float = 0.1;

var forwardFrictionStiffness : float = 0.5;
var sidewaysFrictionStiffness : float = 0.5;

private var aiCycleCounter = 0;
private var currentTargetCar : GameObject;

private var adaptedToUpsideDown : boolean = false;

private var right : Vector3;

function Start () {
	if (bodyMaterial) {
		Body.renderer.material = bodyMaterial;
	}

	// Alter the center of mass to make the car more stable. I'ts less likely to flip this way.
	rigidbody.centerOfMass.y = 0 - LowerCenterOfMassBy;
	rigidbody.centerOfMass.z = 0 + ForwardCenterOfMassBy;
	
	aiCycleCounter = Mathf.FloorToInt( Random.value * aiUpdateFrequency );
	
	var wheels = [FrontLeftWheel, FrontRightWheel, RearLeftWheel, RearRightWheel];
	
	for (var i = 0; i < wheels.Length; i++) {
		wheels[i].suspensionSpring.spring = suspensionSpring;
		wheels[i].suspensionSpring.damper = suspensionDamper;
		wheels[i].suspensionSpring.targetPosition = suspensionTargetPosition;
		wheels[i].forwardFriction.stiffness = forwardFrictionStiffness;
		wheels[i].sidewaysFriction.stiffness = sidewaysFrictionStiffness;
	}
}

function flipCar() {
	RearLeftWheel.transform.Rotate(Vector3.forward * 180);
	RearRightWheel.transform.Rotate(Vector3.forward * 180);
	FrontLeftWheel.transform.Rotate(Vector3.forward * 180);
	FrontRightWheel.transform.Rotate(Vector3.forward * 180);
		
	rigidbody.centerOfMass.y = -rigidbody.centerOfMass.y;
}


function Update () {
	if (isAlive()) {
		aiCycleCounter += 1;
		var thisFrameCanBeExpensive = aiCycleCounter > aiUpdateFrequency;
		if (thisFrameCanBeExpensive) {
			aiCycleCounter = 0;
		}
		
		var currentlyUpsideDown = Vector3.Dot(Vector3.up, transform.up) < 0;
	
		if (currentlyUpsideDown && !adaptedToUpsideDown) {
			flipCar();
			adaptedToUpsideDown = true;
		} else if (adaptedToUpsideDown && !currentlyUpsideDown) {
			flipCar();
			adaptedToUpsideDown = false;
		}
	
		var steering = null;
	
		if (isPlayerControlled) {
			steering = ApplyPlayerControl();
		} else {
			if (thisFrameCanBeExpensive) {
				steering = ApplyAIControl();
			}
		}
		
		if (steering != null) {
			FrontLeftWheel.steerAngle = 15 * steering;
			FrontRightWheel.steerAngle = 15 * steering;
		}
		

		
		RearLeftWheel.motorTorque = EngineTorque * Input.GetAxis("Vertical");
		RearRightWheel.motorTorque = EngineTorque * Input.GetAxis("Vertical");
		
	}
}

function ApplyPlayerControl() : float {
	return Input.GetAxis(controlAxis);
}


function isAlive() : boolean {
	if (!alive) {
		return false;
	} else if (alive && transform.position.y < -1.0) {
		Die();
		return false;
	} else {
		return true;
	}
}

function Die() {
	print(transform.name + " just died.");
	this.alive = false;
	GameObject.Find("_Master").GetComponent(MainScript).dieCar(this.id);
}

function steerTowardsPosition(pos : Vector3) : float {
	var normalizedVectorToPosition = Vector3.Normalize(pos - transform.position);
	var dotProductPositionWithRight = Vector3.Dot(right, normalizedVectorToPosition);
	var dotProductPositionWithAhead = Vector3.Dot(transform.forward, normalizedVectorToPosition);
	
	var steering = 0;
	
	if (dotProductPositionWithAhead > 0 && Mathf.Abs(dotProductPositionWithRight) < 0.05) {
		steering = 0;
	} else if (dotProductPositionWithRight > 0) {
		steering = 1;
	} else {
		steering = -1;
	}
	
	return steering;
}


function ApplyAIControl() : float {
	var steering = null;
	
	var ahead = transform.forward;
	
	if (!adaptedToUpsideDown) {
		right = transform.right;
	} else {
		right = -transform.right;
	}
	
	// check if we are in trouble
	if (false) {
		// avoid trouble
	}
	
	if (steering == null) {
		// we are not in trouble, time to find ourselves an enemy
		
		currentTargetCar = FindBestEnemy();
		
		if (currentTargetCar != null) {
			
			var normalizedVectorToCurrentPosition = Vector3.Normalize( currentTargetCar.transform.position - transform.position );
			var dotProductCurrentPositionWithAhead = Vector3.Dot(ahead, normalizedVectorToCurrentPosition);
			if (dotProductCurrentPositionWithAhead < 0) {
				// opponent is currently behind me!
				steering = steerTowardsPosition(currentTargetCar.transform.position);
			} else {
				// opponent is in front of me, let's aim for his future position
				var OpponentFuturePosition = currentTargetCar.transform.position + currentTargetCar.rigidbody.velocity * 0.5; // TODO: make sense of this constant
				var normalizedVectorToFuturePosition = Vector3.Normalize( OpponentFuturePosition - transform.position );
				
				steering = steerTowardsPosition(OpponentFuturePosition);
			}
		} else {
			// we won!
			steering = steerTowardsPosition(Vector3.zero);
		
		}
	}	
	return steering;
}


// Find the name of the closest Car
function FindBestEnemy () : GameObject {

    // Find all game objects with tag Car
    var gos : GameObject[];
    gos = GameObject.FindGameObjectsWithTag("Car"); 
    var closest : GameObject = null; 
    var distance = Mathf.Infinity; 
    var distanceToCurrentTarget : float = Mathf.Infinity;
    var position = transform.position; 
    // Iterate through them and find the closest one
    for (var go : GameObject in gos)  { 
    	if (go.transform == transform) {
    		// we don't want to attack ourselves
    		continue;
    	}
    	
 		if (!go.GetComponent(BuggyPlayer).alive) {
 			continue;
 		}
    	
        var diff = (go.transform.position - position);
        var curDistance = diff.sqrMagnitude; 
        if (curDistance < distance) { 
            closest = go; 
            distance = curDistance; 
        }
        if (currentTargetCar) {
 			if (go.transform == currentTargetCar.transform) {
 				distanceToCurrentTarget = curDistance;
 			}
 		} 
    } 
    
    if (currentTargetCar) {
    	if (currentTargetCar.GetComponent(BuggyPlayer).alive && distance > distanceToCurrentTarget * aiMeanie) {
    		return currentTargetCar;
    	}
    }
    
    return closest;
}