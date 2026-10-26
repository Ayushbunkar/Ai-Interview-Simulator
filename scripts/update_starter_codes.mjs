// Script to generate clean LeetCode method-only starter codes for all 60 problems
// Completely removes dummy returns like return new int[]{0,0}, return "true", System.out.println("0")
// Provides clear // Start writing your solution below comment
import fs from "fs";
import path from "path";

const METHOD_SPECS = {
  // Easy (20)
  "two-sum": {
    java: `class Solution {\n    // Start writing your solution below\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here...\n        \n    }\n};`
  },
  "valid-palindrome": {
    java: `class Solution {\n    // Start writing your solution below\n    public boolean isPalindrome(String s) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def isPalindrome(self, s: str) -> bool:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    bool isPalindrome(string s) {\n        // Write your code here...\n        \n    }\n};`
  },
  "valid-parentheses": {
    java: `class Solution {\n    // Start writing your solution below\n    public boolean isValid(String s) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def isValid(self, s: str) -> bool:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    bool isValid(string s) {\n        // Write your code here...\n        \n    }\n};`
  },
  "best-time-to-buy-and-sell-stock": {
    java: `class Solution {\n    // Start writing your solution below\n    public int maxProfit(int[] prices) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def maxProfit(self, prices: list[int]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int maxProfit(vector<int>& prices) {\n        // Write your code here...\n        \n    }\n};`
  },
  "binary-search": {
    java: `class Solution {\n    // Start writing your solution below\n    public int search(int[] nums, int target) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def search(self, nums: list[int], target: int) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int search(vector<int>& nums, int target) {\n        // Write your code here...\n        \n    }\n};`
  },
  "contains-duplicate": {
    java: `class Solution {\n    // Start writing your solution below\n    public boolean containsDuplicate(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    bool containsDuplicate(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "valid-anagram": {
    java: `class Solution {\n    // Start writing your solution below\n    public boolean isAnagram(String s, String t) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def isAnagram(self, s: str, t: str) -> bool:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    bool isAnagram(string s, string t) {\n        // Write your code here...\n        \n    }\n};`
  },
  "maximum-subarray": {
    java: `class Solution {\n    // Start writing your solution below\n    public int maxSubArray(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def maxSubArray(self, nums: list[int]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int maxSubArray(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "climbing-stairs": {
    java: `class Solution {\n    // Start writing your solution below\n    public int climbStairs(int n) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def climbStairs(self, n: int) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int climbStairs(int n) {\n        // Write your code here...\n        \n    }\n};`
  },
  "reverse-string": {
    java: `class Solution {\n    // Start writing your solution below\n    public void reverseString(char[] s) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def reverseString(self, s: list[str]) -> None:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    void reverseString(vector<char>& s) {\n        // Write your code here...\n        \n    }\n};`
  },
  "merge-two-sorted-lists": {
    java: `class Solution {\n    // Start writing your solution below\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def mergeTwoLists(self, list1, list2):\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        // Write your code here...\n        \n    }\n};`
  },
  "single-number": {
    java: `class Solution {\n    // Start writing your solution below\n    public int singleNumber(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def singleNumber(self, nums: list[int]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int singleNumber(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "majority-element": {
    java: `class Solution {\n    // Start writing your solution below\n    public int majorityElement(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def majorityElement(self, nums: list[int]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int majorityElement(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "missing-number": {
    java: `class Solution {\n    // Start writing your solution below\n    public int missingNumber(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def missingNumber(self, nums: list[int]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int missingNumber(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "move-zeroes": {
    java: `class Solution {\n    // Start writing your solution below\n    public void moveZeroes(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def moveZeroes(self, nums: list[int]) -> None:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    void moveZeroes(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "reverse-linked-list": {
    java: `class Solution {\n    // Start writing your solution below\n    public ListNode reverseList(ListNode head) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def reverseList(self, head):\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    ListNode* reverseList(ListNode* head) {\n        // Write your code here...\n        \n    }\n};`
  },
  "symmetric-tree": {
    java: `class Solution {\n    // Start writing your solution below\n    public boolean isSymmetric(TreeNode root) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def isSymmetric(self, root) -> bool:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    bool isSymmetric(TreeNode* root) {\n        // Write your code here...\n        \n    }\n};`
  },
  "invert-binary-tree": {
    java: `class Solution {\n    // Start writing your solution below\n    public TreeNode invertTree(TreeNode root) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def invertTree(self, root):\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    TreeNode* invertTree(TreeNode* root) {\n        // Write your code here...\n        \n    }\n};`
  },
  "diameter-of-binary-tree": {
    java: `class Solution {\n    // Start writing your solution below\n    public int diameterOfBinaryTree(TreeNode root) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def diameterOfBinaryTree(self, root) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int diameterOfBinaryTree(TreeNode* root) {\n        // Write your code here...\n        \n    }\n};`
  },
  "intersection-of-two-arrays": {
    java: `class Solution {\n    // Start writing your solution below\n    public int[] intersection(int[] nums1, int[] nums2) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def intersection(self, nums1: list[int], nums2: list[int]) -> list[int]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<int> intersection(vector<int>& nums1, vector<int>& nums2) {\n        // Write your code here...\n        \n    }\n};`
  },

  // Medium (30)
  "longest-substring-without-repeating-characters": {
    java: `class Solution {\n    // Start writing your solution below\n    public int lengthOfLongestSubstring(String s) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int lengthOfLongestSubstring(string s) {\n        // Write your code here...\n        \n    }\n};`
  },
  "3sum": {
    java: `class Solution {\n    // Start writing your solution below\n    public List<List<Integer>> threeSum(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def threeSum(self, nums: list[int]) -> list[list[int]]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "container-with-most-water": {
    java: `class Solution {\n    // Start writing your solution below\n    public int maxArea(int[] height) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def maxArea(self, height: list[int]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int maxArea(vector<int>& height) {\n        // Write your code here...\n        \n    }\n};`
  },
  "longest-palindromic-substring": {
    java: `class Solution {\n    // Start writing your solution below\n    public String longestPalindrome(String s) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def longestPalindrome(self, s: str) -> str:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    string longestPalindrome(string s) {\n        // Write your code here...\n        \n    }\n};`
  },
  "group-anagrams": {
    java: `class Solution {\n    // Start writing your solution below\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        // Write your code here...\n        \n    }\n};`
  },
  "top-k-frequent-elements": {
    java: `class Solution {\n    // Start writing your solution below\n    public int[] topKFrequent(int[] nums, int k) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def topKFrequent(self, nums: list[int], k: int) -> list[int]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        // Write your code here...\n        \n    }\n};`
  },
  "product-of-array-except-self": {
    java: `class Solution {\n    // Start writing your solution below\n    public int[] productExceptSelf(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def productExceptSelf(self, nums: list[int]) -> list[int]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<int> productExceptSelf(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "search-in-rotated-sorted-array": {
    java: `class Solution {\n    // Start writing your solution below\n    public int search(int[] nums, int target) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def search(self, nums: list[int], target: int) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int search(vector<int>& nums, int target) {\n        // Write your code here...\n        \n    }\n};`
  },
  "find-minimum-in-rotated-sorted-array": {
    java: `class Solution {\n    // Start writing your solution below\n    public int findMin(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def findMin(self, nums: list[int]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int findMin(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "kth-largest-element-in-an-array": {
    java: `class Solution {\n    // Start writing your solution below\n    public int findKthLargest(int[] nums, int k) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def findKthLargest(self, nums: list[int], k: int) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int findKthLargest(vector<int>& nums, int k) {\n        // Write your code here...\n        \n    }\n};`
  },
  "coin-change": {
    java: `class Solution {\n    // Start writing your solution below\n    public int coinChange(int[] coins, int amount) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def coinChange(self, coins: list[int], amount: int) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int coinChange(vector<int>& coins, int amount) {\n        // Write your code here...\n        \n    }\n};`
  },
  "longest-increasing-subsequence": {
    java: `class Solution {\n    // Start writing your solution below\n    public int lengthOfLIS(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def lengthOfLIS(self, nums: list[int]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int lengthOfLIS(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "word-break": {
    java: `class Solution {\n    // Start writing your solution below\n    public boolean wordBreak(String s, List<String> wordDict) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def wordBreak(self, s: str, wordDict: list[str]) -> bool:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    bool wordBreak(string s, vector<string>& wordDict) {\n        // Write your code here...\n        \n    }\n};`
  },
  "combination-sum": {
    java: `class Solution {\n    // Start writing your solution below\n    public List<List<Integer>> combinationSum(int[] candidates, int target) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {\n        // Write your code here...\n        \n    }\n};`
  },
  "subsets": {
    java: `class Solution {\n    // Start writing your solution below\n    public List<List<Integer>> subsets(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def subsets(self, nums: list[int]) -> list[list[int]]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<vector<int>> subsets(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "permutations": {
    java: `class Solution {\n    // Start writing your solution below\n    public List<List<Integer>> permute(int[] nums) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def permute(self, nums: list[int]) -> list[list[int]]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<vector<int>> permute(vector<int>& nums) {\n        // Write your code here...\n        \n    }\n};`
  },
  "number-of-islands": {
    java: `class Solution {\n    // Start writing your solution below\n    public int numIslands(char[][] grid) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def numIslands(self, grid: list[list[str]]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int numIslands(vector<vector<char>>& grid) {\n        // Write your code here...\n        \n    }\n};`
  },
  "course-schedule": {
    java: `class Solution {\n    // Start writing your solution below\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        // Write your code here...\n        \n    }\n};`
  },
  "clone-graph": {
    java: `class Solution {\n    // Start writing your solution below\n    public Node cloneGraph(Node node) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def cloneGraph(self, node):\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    Node* cloneGraph(Node* node) {\n        // Write your code here...\n        \n    }\n};`
  },
  "pacific-atlantic-water-flow": {
    java: `class Solution {\n    // Start writing your solution below\n    public List<List<Integer>> pacificAtlantic(int[][] heights) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def pacificAtlantic(self, heights: list[list[int]]) -> list[list[int]]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {\n        // Write your code here...\n        \n    }\n};`
  },
  "validate-binary-search-tree": {
    java: `class Solution {\n    // Start writing your solution below\n    public boolean isValidBST(TreeNode root) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def isValidBST(self, root) -> bool:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    bool isValidBST(TreeNode* root) {\n        // Write your code here...\n        \n    }\n};`
  },
  "kth-smallest-element-in-a-bst": {
    java: `class Solution {\n    // Start writing your solution below\n    public int kthSmallest(TreeNode root, int k) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def kthSmallest(self, root, k: int) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int kthSmallest(TreeNode* root, int k) {\n        // Write your code here...\n        \n    }\n};`
  },
  "lowest-common-ancestor-of-a-binary-tree": {
    java: `class Solution {\n    // Start writing your solution below\n    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def lowestCommonAncestor(self, root, p, q):\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        // Write your code here...\n        \n    }\n};`
  },
  "binary-tree-level-order-traversal": {
    java: `class Solution {\n    // Start writing your solution below\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def levelOrder(self, root) -> list[list[int]]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        // Write your code here...\n        \n    }\n};`
  },
  "lru-cache": {
    java: `class LRUCache {\n    // Start writing your solution below\n    public LRUCache(int capacity) {\n        // Write your code here...\n        \n    }\n    \n    public int get(int key) {\n        // Write your code here...\n        \n    }\n    \n    public void put(int key, int value) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class LRUCache:\n    # Start writing your solution below\n    def __init__(self, capacity: int):\n        # Write your code here...\n        pass\n\n    def get(self, key: int) -> int:\n        # Write your code here...\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        # Write your code here...\n        pass\n`,
    cpp: `class LRUCache {\npublic:\n    // Start writing your solution below\n    LRUCache(int capacity) {\n        // Write your code here...\n        \n    }\n    \n    int get(int key) {\n        // Write your code here...\n        \n    }\n    \n    void put(int key, int value) {\n        // Write your code here...\n        \n    }\n};`
  },
  "merge-intervals": {
    java: `class Solution {\n    // Start writing your solution below\n    public int[][] merge(int[][] intervals) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your code here...\n        \n    }\n};`
  },
  "non-overlapping-intervals": {
    java: `class Solution {\n    // Start writing your solution below\n    public int eraseOverlapIntervals(int[][] intervals) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def eraseOverlapIntervals(self, intervals: list[list[int]]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int eraseOverlapIntervals(vector<vector<int>>& intervals) {\n        // Write your code here...\n        \n    }\n};`
  },
  "rotate-image": {
    java: `class Solution {\n    // Start writing your solution below\n    public void rotate(int[][] matrix) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def rotate(self, matrix: list[list[int]]) -> None:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    void rotate(vector<vector<int>>& matrix) {\n        // Write your code here...\n        \n    }\n};`
  },
  "spiral-matrix": {
    java: `class Solution {\n    // Start writing your solution below\n    public List<Integer> spiralOrder(int[][] matrix) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def spiralOrder(self, matrix: list[list[int]]) -> list[int]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<int> spiralOrder(vector<vector<int>>& matrix) {\n        // Write your code here...\n        \n    }\n};`
  },
  "set-matrix-zeroes": {
    java: `class Solution {\n    // Start writing your solution below\n    public void setZeroes(int[][] matrix) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def setZeroes(self, matrix: list[list[int]]) -> None:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    void setZeroes(vector<vector<int>>& matrix) {\n        // Write your code here...\n        \n    }\n};`
  },

  // Hard (10)
  "trapping-rain-water": {
    java: `class Solution {\n    // Start writing your solution below\n    public int trap(int[] height) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def trap(self, height: list[int]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int trap(vector<int>& height) {\n        // Write your code here...\n        \n    }\n};`
  },
  "merge-k-sorted-lists": {
    java: `class Solution {\n    // Start writing your solution below\n    public ListNode mergeKLists(ListNode[] lists) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def mergeKLists(self, lists):\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        // Write your code here...\n        \n    }\n};`
  },
  "sliding-window-maximum": {
    java: `class Solution {\n    // Start writing your solution below\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def maxSlidingWindow(self, nums: list[int], k: int) -> list[int]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        // Write your code here...\n        \n    }\n};`
  },
  "median-of-two-sorted-arrays": {
    java: `class Solution {\n    // Start writing your solution below\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        // Write your code here...\n        \n    }\n};`
  },
  "regular-expression-matching": {
    java: `class Solution {\n    // Start writing your solution below\n    public boolean isMatch(String s, String p) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def isMatch(self, s: str, p: str) -> bool:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    bool isMatch(string s, string p) {\n        // Write your code here...\n        \n    }\n};`
  },
  "n-queens": {
    java: `class Solution {\n    // Start writing your solution below\n    public List<List<String>> solveNQueens(int n) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def solveNQueens(self, n: int) -> list[list[str]]:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    vector<vector<string>> solveNQueens(int n) {\n        // Write your code here...\n        \n    }\n};`
  },
  "word-ladder": {
    java: `class Solution {\n    // Start writing your solution below\n    public int ladderLength(String beginWord, String endWord, List<String> wordList) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def ladderLength(self, beginWord: str, endWord: str, wordList: list[str]) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {\n        // Write your code here...\n        \n    }\n};`
  },
  "binary-tree-maximum-path-sum": {
    java: `class Solution {\n    // Start writing your solution below\n    public int maxPathSum(TreeNode root) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def maxPathSum(self, root) -> int:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    int maxPathSum(TreeNode* root) {\n        // Write your code here...\n        \n    }\n};`
  },
  "find-median-from-data-stream": {
    java: `class MedianFinder {\n    // Start writing your solution below\n    public MedianFinder() {\n        // Write your code here...\n        \n    }\n    \n    public void addNum(int num) {\n        // Write your code here...\n        \n    }\n    \n    public double findMedian() {\n        // Write your code here...\n        \n    }\n}`,
    python: `class MedianFinder:\n    # Start writing your solution below\n    def __init__(self):\n        # Write your code here...\n        pass\n\n    def addNum(self, num: int) -> None:\n        # Write your code here...\n        pass\n\n    def findMedian(self) -> float:\n        # Write your code here...\n        pass\n`,
    cpp: `class MedianFinder {\npublic:\n    // Start writing your solution below\n    MedianFinder() {\n        // Write your code here...\n        \n    }\n    \n    void addNum(int num) {\n        // Write your code here...\n        \n    }\n    \n    double findMedian() {\n        // Write your code here...\n        \n    }\n};`
  },
  "alien-dictionary": {
    java: `class Solution {\n    // Start writing your solution below\n    public String alienOrder(String[] words) {\n        // Write your code here...\n        \n    }\n}`,
    python: `class Solution:\n    # Start writing your solution below\n    def alienOrder(self, words: list[str]) -> str:\n        # Write your code here...\n        pass\n`,
    cpp: `class Solution {\npublic:\n    // Start writing your solution below\n    string alienOrder(vector<string>& words) {\n        // Write your code here...\n        \n    }\n};`
  }
};

// Update data/coding/easy.json, medium.json, hard.json
['easy', 'medium', 'hard'].forEach(diff => {
  const filePath = path.resolve(`./data/coding/${diff}.json`);
  const list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  let updatedCount = 0;
  for (const p of list) {
    const spec = METHOD_SPECS[p.slug];
    if (spec) {
      p.starterCodeJava = spec.java;
      p.starterCodePython = spec.python;
      p.starterCodeCpp = spec.cpp;
      updatedCount++;
    } else {
      // Default fallback clean method template
      p.starterCodeJava = `class Solution {\n    // Start writing your solution below\n    public String solve(String input) {\n        // Write your code here...\n        \n    }\n}`;
      p.starterCodePython = `class Solution:\n    # Start writing your solution below\n    def solve(self, input: str) -> str:\n        # Write your code here...\n        pass\n`;
      p.starterCodeCpp = `class Solution {\npublic:\n    // Start writing your solution below\n    string solve(string input) {\n        // Write your code here...\n        \n    }\n};`;
      updatedCount++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
  console.log(`Updated ${updatedCount} problems in ${diff}.json`);
});
