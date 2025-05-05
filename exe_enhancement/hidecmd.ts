import { readFileSync, writeFileSync } from "fs";

// Constants for PE header
const PE_SIGNATURE = 0x00004550; // "PE\0\0"
const IMAGE_SUBSYSTEM_WINDOWS_GUI = 2; // Subsystem type for Windows GUI

function modifyExeSubsystem(filePath: string) {
  console.log(`Attempting to modify subsystem for: ${filePath}`);
  // Read the executable file
  const exeBuffer = readFileSync(filePath);

  // Check for PE signature
  const dosHeader = exeBuffer.subarray(0, 64);
  const peOffset = dosHeader.readUInt32LE(60);
  const peHeader = exeBuffer.subarray(peOffset, peOffset + 4);

  if (peHeader.readUInt32LE(0) !== PE_SIGNATURE) {
    throw new Error("Not a valid PE file");
  }

  // Locate the subsystem field in the PE header
  const subsystemOffset = peOffset + 0x5c; // Subsystem is at offset 0x5C from PE header
  const currentSubsystem = exeBuffer.readUInt16LE(subsystemOffset);

  console.log(`Current Subsystem: ${currentSubsystem}`);

  if (currentSubsystem === IMAGE_SUBSYSTEM_WINDOWS_GUI) {
    console.log("Subsystem is already Windows GUI. No changes needed.");
    return; // Exit if already correct
  }

  // Modify the subsystem to Windows GUI
  exeBuffer.writeUInt16LE(IMAGE_SUBSYSTEM_WINDOWS_GUI, subsystemOffset);

  // Write the modified buffer back to the file
  writeFileSync(filePath, exeBuffer);
  console.log("Subsystem modified successfully to Windows GUI.");
}

// Get file path from command line arguments
// process.argv[0] is node/bun executable
// process.argv[1] is the script file (hidecmd.ts)
// process.argv[2] is the first actual argument
const exeFilePath = process.argv[2];

if (!exeFilePath) {
  console.error("Error: No executable path provided as a command line argument.");
  process.exit(1);
}

try {
  modifyExeSubsystem(exeFilePath);
} catch (error) {
  console.error("Error modifying EXE subsystem:", error instanceof Error ? error.message : String(error));
  process.exit(1); // Exit with error code if modification fails
}
