# Compiley
Compile data from multiple sources to produce work report

# Parsers
- [x] getMeta - get known tables
  - [x] metaUsers(source): { source: id } mapping
  - [x] metaJobs: { product: id } mapping
  - [x] metaTypes: { name: id } mapping
- [x] get list of files we need to process
  - [ ] add file name checker - they need to be unique
    - [ ] add first folder checker - needs to follow a pattern (to be defined)
  - [x] get created, modified timestamp, set current timestamp
  - [x] match filename with known source list
    - [x] file created lower, modified higher - check & replace
      - [ ] figure out some type of check for this
    - [x] file created equal or higher, modified higher - replace
    - [x] what to do if we have more than one same filename as source?
      - [x] first folder within data (so, data/something) should be captured and added to name (data-18-01/file.xls)
- [ ] parseDTI
  - [x] handle meta vs db sate
    - [x] drop source from db if it's already known source (cascade drop for related entries)
    - [x] check if known user (set John Doe for unkowns), get id
      - [ ] better handling for unknown users (ignore currently)
    - [x] check if known job (if not: add to db, update metaJobs), get id
    - [x] check if known type (if not: throw an error, should be defined upfront), get id
    - [x] check if known day (if not: add to db), get id
  - [x] handle standard images
    - [x] set d_type 4 in first go (will be read from claro logs or assumed)
  - [x] handle automatic images
    - [x] set d_type 4 in first go (will be read from claro logs or assumed)
  - [x] handle cutout images
    - [x] solve duration for cutout images
    - [x] d_type = 0 (read from source)
  - [x] end of file db housekeeping
    - [x] reduce jobsAtomic by day / job / source / type / user into job
    - [x] insert new jobs, get id
    - [x] update jobsAtomic with valid id, insert into db
- [x] parseClaroManual
  - [x] write results to helperClaro table
- [ ] parseClaro
  - [ ] link with new Claro API
  - [ ] figure out a way to know which data to request
- [x] parse EasyJob
  - [x] figure out which xls colum links to which db table row
  - [x] handle standard images
  - [x] handle cutout images
  - [x] handle montage
  - [x] handle various extra work
  - [x] handle weird edge cases
  - [x] convert hours to MS
  - [x] set defalut amount to 1
  - [x] set defalut duration to 0
- [x] parse Worktime
  - [x] solve rediculous excel format
  - [x] solve changes in date/time format
  - [x] db transaction
- [x] parse Administracija
  - [x] import from google sheets
  - [x] solve nightmare
- [x] parse Parte
  - [x] collect data, user is null
  - [x] insert one new job per day, get id
  - [x] assign job ID to jobsAtomic, insert transaction

# DB housekeeping
- [ ] helperClaro match with jobsAtomic DTI
  - [ ] standard
  - [ ] automatic
- [ ] helperClaro match with jobs EasyJob
- [ ] days summify
  - [ ] worktime vs jobs adjust assumed time per day
  - [ ] resummify days
  - [ ] report problem inputs
    - [ ] ignore first in month double inputs

# Main logic
- [x] Controller input
  - [x] get excel files from folder
  - [ ] get administration from google sheets
  - [ ] get claro from api
- [ ] Controller output
  - [ ] define API endpoints
  - [ ] link to excel query

# GUI
- [ ] switch to electron-builder
  - [ ] fix dependencies
- [ ] basic layout
  - [ ] start/stop button
  - [ ] message display via IPC
  - [ ] make event emitter from controller/parsers