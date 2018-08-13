const fs = require('fs');
const path = require('path');

export function getDirsFromDir(dir: string): string[] {
	let list = fs.readdirSync(dir);
	if (list && Array.isArray(list)) {
		return list
			.filter((item: string) => {
				let isDir = fs.lstatSync(path.resolve(dir, item)).isDirectory();
				if (isDir) {
					return true;
				} else {
					return false;
				}
			})
			.map((item: string) => {
				return path.resolve(dir, item);
			});
	} else {
		return [];
	}
}

export function getFilesFromDir(dir: string, filterFileType: string): string[] {
	let list = fs.readdirSync(dir);
	if (list && Array.isArray(list)) {
		return list
			.filter((item: string) => {
				let filePath = path.resolve(dir, item);
				let isFile = fs.lstatSync(filePath).isFile();
				if (isFile && path.extname(filePath) === filterFileType) {
					return true;
				} else {
					return false;
				}
			})
			.map((item: string) => {
                let currentFilePath = path.resolve(dir, item);                
				return {
					path: currentFilePath,
					time: fs.statSync(currentFilePath).mtime.getTime()
				};
			})
			.sort(function(a, b) {
				return b.time - a.time;
			})
			.map((item: any) => {                
				return item.path;
			});
	} else {
		return [];
	}
}

export function getDirName(filePath: string): string {
	if (fs.lstatSync(filePath).isDirectory()) {
		//文件夹的话
		return path
			.resolve(filePath)
			.split(path.sep)
			.pop();
	} else {
		//文件的话
		return path
			.dirname(filePath)
			.split(path.sep)
			.pop();
	}
}
