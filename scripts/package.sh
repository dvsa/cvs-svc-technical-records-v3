commitHash="${ZIP_NAME:-local}"

pushd .aws-sam/build

for lambdaName in */; do
  formattedLambdaName=`basename ${lambdaName} /`
  cp -r "../../node_modules/@dvsa/cvs-type-definitions/json-schemas/" "${formattedLambdaName}/json-schemas"
  cp -r "../../package.json" "${formattedLambdaName}"
  pushd $formattedLambdaName

  for file in *.mjs; do
    mv -- "$file" "app.mjs"
  done

  for file in *.mjs.map; do
    mv -- "$file" "app.mjs.map"
  done

  zip -qr ../../../${commitHash}-${formattedLambdaName}.zip .
  popd
done

popd
