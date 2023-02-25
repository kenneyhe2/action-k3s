const core = require('@actions/core');
const exec = require('@actions/exec');
const wait = require('./wait');
const fs = require('fs');

async function run() {
  try {
    const version = core.getInput('version');
    const kubeconfig_location="/tmp/output/kubeconfig-"+version+".yaml";
    console.log(`storing kubeconfig here ${kubeconfig_location}!`); 

    core.exportVariable('KUBECONFIG', kubeconfig_location);
    core.setOutput("kubeconfig", kubeconfig_location);
    let nodeName;
    for(let count = 1; count <= 5; count++) {
      const nodeNameOutput = await exec.getExecOutput("kubectl get nodes --no-headers -oname");
      nodeName = nodeNameOutput.stdout
      if(nodeName) {
        break
      } else {
        console.log(`Unable to resolve node name, waiting 5 seconds and trying again. Attempt ${count} of 5.`)
        await wait(5000);
      }
    }
    if(!nodeName) {
      core.setFailed("Failed to resolve node name.")
      return;
    }
    let command=`kubectl wait --for=condition=Ready ${nodeName}`;
    await exec.exec(command);
  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
