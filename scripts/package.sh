commitHash="${ZIP_NAME:-local}"

cd .aws-sam/build

for lambdaName in */; do
  formattedLambdaName=`basename ${lambdaName} /`
  mv ${formattedLambdaName}/*.js ${formattedLambdaName}/app.js
  mv ${formattedLambdaName}/*.js.map ${formattedLambdaName}/app.js.map
  cp -r "../../node_modules/@dvsa/cvs-type-definitions/json-schemas/" "${formattedLambdaName}/json-schemas"
  zip -qrj ../../${commitHash}-${formattedLambdaName}.zip ${formattedLambdaName}
done
