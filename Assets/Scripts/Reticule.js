var cameraTransform : Transform;

function Update () {

	var hit : RaycastHit;
    if (Physics.Raycast (cameraTransform.position, cameraTransform.forward, hit)) {
    	transform.rotation = cameraTransform.rotation;
        //transform.position = hit.point - cameraTransform.forward;
        transform.position = cameraTransform.position;
    }
}