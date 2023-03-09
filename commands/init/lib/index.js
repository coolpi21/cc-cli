module.exports = init;

function init(projectName, commandObject) {
  console.log(projectName, commandObject.force, process.env.CLI_TARGET_PATH);
}
