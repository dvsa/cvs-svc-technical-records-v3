commitHash="${ZIP_NAME:-local}"

cd .aws-sam/build

for lambdaName in */; do
  formattedLambdaName=`basename ${lambdaName} /`
  cp -r "../../node_modules/@dvsa/cvs-type-definitions/json-schemas/" "${formattedLambdaName}/json-schemas"
  pushd $formattedLambdaName
  zip -qr ../../../${commitHash}-${formattedLambdaName}.zip .
  popd
done
