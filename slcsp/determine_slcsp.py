import csv
import os

def mapBuilder(fileName, mapper):
  mapping = {}
  # Prepare the file
  file = open(fileName, 'r')
  reader = csv.reader(file)
  # Skip header row
  next(reader)
  # Run the mapper over the data
  for row in reader:
    mapper(mapping, row)
  # Close the file and return
  file.close()
  return mapping

def rateAreaMapper(mapping, row):
  # We don't need the county code or place name
  [zipcode, state, _, _, rateArea] = row
  # Use the combined state and rate area number for comparing and mapping
  rateAreaCode = state + rateArea
  # Assign the set of rate area codes to the zipcode using sets to prevent
  # duplicates
  mapping[zipcode] = mapping.get(zipcode, set()).union(set([rateAreaCode]))

def silverPlanMapper(mapping, row):
  # We don't need the plan id
  [_, state, metalLevel, rate, rateArea] = row
  # Use the combined state and rate area number for comparing and mapping
  rateAreaCode = state + rateArea
  if metalLevel == 'Silver':
    knownPlans = mapping.get(rateAreaCode, [])
    # Add the plan if this is the first silver plan
    if len(knownPlans) == 0:
      mapping[rateAreaCode] = [rate]
    # If the plan has a lower rate than the current lowest rate, put this plan
    # in the 0th position and demote the old lowest rate to 1st position
    elif rate < knownPlans[0]:
      # We don't care about anything more expensive because it can't be the
      # second lowest rate
      mapping[rateAreaCode] = [rate, knownPlans[0]]
    # If there's only one plan anyway OR if the plan is more than the lowest
    # cost plan BUT less than the second lowest cost plan, replace the second
    # lowest cost plan
    elif rate != knownPlans[0] and (len(knownPlans) < 2 or rate < knownPlans[1]):
      # We don't care about anything more expensive because it can't be the
      # second lowest rate
      mapping[rateAreaCode] = [knownPlans[0], rate]

def determineSLCSP(zipcode, rateAreaMap, silverPlanMap):
  rateAreas = rateAreaMap.get(zipcode, set())
  # Return if there are no rate areas or too many rate areas
  if len(rateAreas) != 1:
    print('Wrong number of rate areas for ' + zipcode)
    return ''
  silverPlans = silverPlanMap.get(list(rateAreas)[0], [])
  # Return if there aren't enough silver plans in a rate area
  if len(silverPlans) < 2:
    print('Not enough plans for ' + zipcode)
    return ''
  # Retrieve the rate of the second lowest cost silver plan
  return silverPlans[1]

def determineFileSLCSP(planFileName, zipsFileName, slcspFileName):
  slcspFileNameTemp = 'tmp_' + slcspFileName
  # Build the dicts required to determine the SLCSP
  rateAreaMap = mapBuilder(zipsFileName, rateAreaMapper)
  silverPlanMap = mapBuilder(planFileName, silverPlanMapper)
  # Open the input and output files
  readFile = open(slcspFileName, 'r')
  reader = csv.reader(readFile)
  writeFile = open(slcspFileNameTemp, 'w')
  writer = csv.writer(writeFile)
  # Skip the header
  next(reader)
  writer.writerow([
    'zipcode',
    'rate'
  ])
  # Build the output file
  for row in reader:
    # Ignore the rate column
    [zipcode, _] = row
    # Write the row in the output file for the second lowest rate
    writer.writerow([
      zipcode,
      determineSLCSP(zipcode, rateAreaMap, silverPlanMap)
    ])
  # Close the files
  readFile.close()
  writeFile.close()
  # Overwrite the original file
  os.rename(slcspFileNameTemp, slcspFileName)
  print('Rate determining process complete!')

if __name__ == "__main__":
  determineFileSLCSP('plans.csv', 'zips.csv', 'slcsp.csv')
