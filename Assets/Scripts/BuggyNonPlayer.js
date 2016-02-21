var wheelRenderers : Renderer[];

function Update () {
	var seconds : int = Time.time;
	var oddeven : boolean = (seconds % 2) == 0;
	
	for (var i : int = 0; i < wheelRenderers.length; i++) {
		wheelRenderers[i].enabled = oddeven;
	}

}